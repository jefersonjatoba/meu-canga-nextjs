# 📋 Análise Completa do Módulo RAS (v1 → v2)

## 🎯 Objetivo
Migrar o módulo RAS (Regime Adicional de Serviço) de Node/Express para Next.js 16 com Supabase.

---

## 📊 Estrutura Identificada no v1

### 1. **Configurações (ras.config.js)**

#### Tabela de Preços por Patente e Horas
```javascript
{
  "SD/CB": { 6: 20863, 8: 27247, 12: 40015, 24: 78321 },        // Soldado/Cabo
  "SGT/SUBTEN": { 6: 24392, 8: 31952, 12: 47074, 24: 92437 }    // Sargento/Subtenente
}
```
- Preços em centavos (20863 = R$ 208,63)
- Opções de duração: 6h, 8h, 12h, 24h

#### Locais de Trabalho (3 categorias)
- **BPM**: 47 batalhões (1º ao 47º BPM)
- **Unidades Especiais**: BOPE, BPChq, RECOM, BPVE, BAC, GAM, BPRv, GPFer, CPAM, BPtur, BEPE
- **UPP**: 16 unidades de polícia pacificadora

---

### 2. **Banco de Dados (4 tabelas)**

#### `ras_agendamentos`
```sql
id (PK)
user_id
data (YYYY-MM-DD)
tipo ('ras')
alarme_ativo (0/1)
criado_em (TIMESTAMP)
UNIQUE(user_id, data)
```
**Uso**: Marcar/desmarcar datas rápidas no calendário

#### `ras_agenda` (Principal)
```sql
id (PK)
user_id
data_ras (YYYY-MM-DD)
hora_inicio (INTEGER: 0-23)
duracao (6, 8, 12, 24)
graduacao (SD/CB, SGT/SUBTEN)
tipo ('voluntario' | ?)
local (BPM/UPP/Especial)
valor_cents (calculado)
tipo_vaga ('titular' | ?)
status ('agendado' | 'pendente' | 'realizado' | 'confirmado' | 'cancelado')
observacao (TEXT)
data_confirmacao (quando confirmado)
observacao_confirmacao (observações do admin)
comprovante_path (PDF gerado)
notif_pendente_enviada (flag para notificação)
expires_at (TIMESTAMP: 72h após inicio)
created_at (TIMESTAMP)
```

**Status Flow**:
1. `agendado` → Usuário criou RAS futuro
2. `pendente` → Chegou a data, esperando marcação de realizado
3. `realizado` → Usuário marcou como feito (janela 72h aberta)
4. `confirmado` → Admin confirmou, RAS é oficializado
5. `cancelado` → RAS cancelado/rejeitado

**Regra de 72h**:
- Após marcar "realizado", há 72h para confirmar
- Se não confirmar em 72h, transição automática: `realizado` → `pendente`

#### `ras_pagamentos`
```sql
id (PK)
user_id
mes_ref (YYYY-MM)
valor_cents (total do mês)
status ('pendente' | 'pago' | ?)
data_pgto
observacao
created_at
```
**Uso**: Controlar pagamentos mensais de RAS confirmados

#### `ras_cenarios_salvos`
```sql
id (PK)
user_id
nome (ex: "Cenário Verão 2025")
items (JSON)
total_horas
total_valor_cents
criado_em
```
**Uso**: Simulador — usuário salva combinações de RAS

---

### 3. **Rotas/Endpoints (ras.routes.js)**

#### Páginas (Server-Side Rendering)
| Rota | Descrição |
|------|-----------|
| `GET /ras` | Dashboard principal (3 abas) |
| `GET /ras?aba=agenda&ano=2025&mes=4` | Aba "Agenda" - calendário + forma |
| `GET /ras?aba=historico` | Aba "Histórico" - lista com filtros |
| `GET /ras?aba=graficos` | Aba "Gráficos" - análise visual |
| `GET /ras/simulador` | Simulador de cenários |
| `GET /ras/:id/comprovante` | PDF do RAS confirmado |

#### API Endpoints (JSON)
| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/ras/agendar` | Criar RAS novo |
| `POST` | `/ras/:id/editar` | Editar RAS agendado |
| `POST` | `/ras/:id/delete` | Remover RAS |
| `POST` | `/ras/:id/realizar` | Marcar como "realizado" |
| `POST` | `/ras/marcar` | Marcar data rápida no calendário (sem detalhes) |
| `POST` | `/ras/desmarcar` | Desmarcar data |
| `POST` | `/api/ras/:id/confirmar` | Admin confirma RAS (JSON) |
| `POST` | `/api/ras/:id/realizar` | Marcar realizado (JSON) |
| `GET` | `/api/ras/verificar-conflitos` | Checa se há Escala no mesmo dia |
| `GET` | `/api/ras/conflitos` | Lista detalhada de conflitos horários |
| `GET` | `/ras/historico` | Página de histórico com paginação |
| `POST` | `/api/ras/simular` | Calcula valor de cenário |
| `POST` | `/api/ras/salvar-cenario` | Salva cenário simulado |
| `GET` | `/api/ras/debug` | Debug (mostra status de todos os RAS) |
| `GET` | `/api/ras/debug/status` | Debug JSON |

---

### 4. **Lógica de Negócio**

#### ⏱️ Validação de Datas e Janelas
```javascript
// Data de hoje (São Paulo timezone)
getDataHojeSP() → "2025-04-11"

// Evento início (data + hora)
_eventoInicioSP(data_ras, hora_inicio) → Date object

// Validar 72h: pode marcar realizado?
podeMarcarRealizado(data_ras, hora_inicio)
  → true se agora está entre evento e evento+72h
  
// Auto-transição: 72h expirou?
atualizarStatusPendentes(userId)
  → UPDATE realizado→pendente se expires_at <= now
```

#### 🔢 Cálculo de Valor
```javascript
calcValorRas(graduacao, horas) {
  return RAS_PRICE_TABLE[graduacao][horas]
  // Ex: calcValorRas("SD/CB", 8) = 27247 (R$ 272,47)
}
```

#### 🛡️ Validações
- **Plano Free**: limite de RAS (via `checkRas()`)
- **120h/mês**: limite de horas (após v2.0)
- **Conflito com Escala**: não pode ter RAS + plantão mesmo dia/hora
- **Data futura**: não pode marcar como "realizado" RAS futuro
- **Janela 72h**: só confirma se dentro da janela ou em pendente

#### 📧 Notificações
- Aviso quando transição `realizado` → `pendente` (expirou janela)
- Possível integração com alarmes/push

---

### 5. **Frontend Features**

#### Calendário Interativo
- Click para marcar/desmarcar datas rápidas
- Visual: destacar datas marcadas, datas com RAS detalhado
- Sincronização via fetch (POST /marcar, /desmarcar)

#### Formulário de RAS
- Data de RAS
- Hora início (0-23)
- Duração (radio: 6h, 8h, 12h, 24h)
- Graduação (select: SD/CB, SGT/SUBTEN)
- Local (select: BPM/UPP/Especial)
- Tipo (radio: voluntário, compulsório?, ?)
- Tipo de vaga (titular, substituto?)
- Observação (textarea)
- **Valor é calculado automaticamente** (read-only)

#### Histórico com Filtros
- Status: agendado, pendente, realizado, confirmado, cancelado
- Local: text search
- Data início / Data fim
- Paginação (20 por página)
- Ações: Editar, Deletar, Marcar Realizado, Confirmar

#### Simulador
- Escolher RAS (data, hora, duracao, graduacao, local)
- Adicionar múltiplos itens
- Calcular total de horas + valor
- Mostrar limite restante (120h - usadas)
- Salvar cenário com nome
- Carregar cenários salvos

#### Relatórios/Gráficos
- Total de horas por mês
- Total de valor por mês
- Distribuição por local
- Distribuição por status

---

## 🔄 Fluxo Completo de um RAS

```
1. Usuário agenda RAS futuro
   POST /ras/agendar → status='agendado'

2. Data chegou
   GET /ras → atualizarStatusPendentes()
   status='agendado' → 'pendente' (automático)

3. Usuário trabalhou, marca realizado
   POST /ras/:id/realizar → status='realizado'
   expires_at = agora + 72h

4. Usuário (ou admin) dentro de 72h confirma
   POST /api/ras/:id/confirmar → status='confirmado'

5. Se não confirmar em 72h
   GET /ras (ou cron) → atualizarStatusPendentes()
   status='realizado' → 'pendente' (automático)
   
6. Mensalmente, gera pagamento
   RAS_PAGAMENTOS.valor_cents = SUM(ras_agenda.valor_cents) 
   onde status='confirmado' AND mes=X
```

---

## 🚨 Regras Críticas para Migração

### Data/Hora
- ✅ Sempre usar timezone São Paulo (America/Sao_Paulo)
- ✅ Datas em formato YYYY-MM-DD (local, não UTC)
- ✅ Usar `Intl.DateTimeFormat` para garantir fuso correto

### Segurança
- ✅ XSS: sempre escHtml() em valores de query
- ✅ SQL Injection: use parameterized queries
- ✅ CSRF: validar token em POST
- ✅ Autenticação: validar userId em cada endpoint

### Performance
- ✅ Índices em (user_id, data_ras, status)
- ✅ Query eficiente para conflitos (ESCALA + RAS mesmo dia)
- ✅ Cache de configurações (preços, locais)

---

## 🏗️ Recomendação de Implementação (v2)

### **Fase 1: Foundation (2-3h)**
1. ✅ Schema Supabase (4 tabelas)
2. ✅ Types TypeScript
3. ✅ Repository (CRUD básico)
4. ✅ Service (lógica: calcValorRas, validações, transições)

### **Fase 2: API (2-3h)**
1. ✅ Endpoints GET/POST/PUT/DELETE `/api/ras/*`
2. ✅ Endpoint de simulação
3. ✅ Validações de negócio

### **Fase 3: UI (3-4h)**
1. ✅ Página `/dashboard/ras` (3 abas)
2. ✅ Calendário interativo
3. ✅ Formulário
4. ✅ Histórico com filtros
5. ✅ Simulador

### **Fase 4: Polish (1-2h)**
1. ✅ PDF comprovante
2. ✅ Notificações
3. ✅ Testes

---

## 📝 Arquivos Chave do v1
- `modules/ras/ras.config.js` → valores, locais
- `modules/ras/ras.routes.js` → 95% da lógica
- `modules/ras/ras-calendar-fix.js` → interaction do calendário

**Tamanho**: ~3000 linhas no ras.routes.js (inclui HTML renderizado)

---

## ⚡ Diferenças v1 → v2

| Aspecto | v1 (Express) | v2 (Next.js) |
|---------|-------------|------------|
| Autenticação | Session | Supabase + JWT |
| BD | SQLite local | PostgreSQL Supabase |
| API | SSR (HTML) + JSON endpoints | API routes JSON |
| UI | Server-rendered templates | React components |
| Timezone | Manual com Intl | Mesmo padrão |
| Pagamentos | Tabela `ras_pagamentos` | Possível integração futura |
