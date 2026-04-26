-- Migration: fix_monetary_floats_to_cents
-- Converts all Float monetary columns to Int (centavos).
-- DEFAULT 0 added to NOT NULL columns to allow safe application on tables with existing rows.

-- ─── User — plan fields ───────────────────────────────────────────────────────

ALTER TABLE "User" ADD COLUMN "horasRasAlvo" INTEGER;
ALTER TABLE "User" ADD COLUMN "metaMensal" INTEGER;
ALTER TABLE "User" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "User" ADD COLUMN "planExpiresAt" TIMESTAMP(3);

-- ─── Conta ───────────────────────────────────────────────────────────────────

ALTER TABLE "Conta" DROP COLUMN "agencia",
                    DROP COLUMN "numero",
                    DROP COLUMN "saldoAtual",
ADD COLUMN "cor"            TEXT,
ADD COLUMN "diaFechamento"  INTEGER,
ADD COLUMN "diaVencimento"  INTEGER,
ADD COLUMN "limiteCentavos" INTEGER,
ADD COLUMN "saldoCentavos"  INTEGER NOT NULL DEFAULT 0;

-- ─── Lancamento ──────────────────────────────────────────────────────────────

ALTER TABLE "Lancamento" DROP COLUMN "valor",
ADD COLUMN "competenciaAt" TEXT,
ADD COLUMN "metaJson"       JSONB,
ADD COLUMN "parcelaAtual"   INTEGER,
ADD COLUMN "parcelas"       INTEGER,
ADD COLUMN "parentId"       TEXT,
ADD COLUMN "source"         TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN "valorCentavos"  INTEGER NOT NULL DEFAULT 0;

-- ─── Meta ────────────────────────────────────────────────────────────────────

ALTER TABLE "Meta" DROP COLUMN "valorAlvo",
                   DROP COLUMN "valorAtual",
ADD COLUMN "valorAlvoCentavos"  INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "valorAtualCentavos" INTEGER NOT NULL DEFAULT 0;

-- ─── Recorrencia ─────────────────────────────────────────────────────────────

ALTER TABLE "Recorrencia" DROP COLUMN "valor",
ADD COLUMN "valorCentavos" INTEGER NOT NULL DEFAULT 0;

-- ─── Investimento ────────────────────────────────────────────────────────────

ALTER TABLE "Investimento" DROP COLUMN "precoAtual",
                            DROP COLUMN "precoMedio",
                            DROP COLUMN "valor",
ADD COLUMN "precoAtualCentavos" INTEGER,
ADD COLUMN "precoMedioCentavos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "valorCentavos"      INTEGER NOT NULL DEFAULT 0;

-- ─── Índices e foreign key ────────────────────────────────────────────────────

CREATE UNIQUE INDEX "Escala_userId_dataEscala_horaInicio_key" ON "Escala"("userId", "dataEscala", "horaInicio");

CREATE INDEX "Lancamento_competenciaAt_idx" ON "Lancamento"("competenciaAt");
CREATE INDEX "Lancamento_tipo_idx" ON "Lancamento"("tipo");

ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "Lancamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
