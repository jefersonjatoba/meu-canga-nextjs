-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Escala" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dataEscala" TIMESTAMP(3) NOT NULL,
    "tipoTurno" TEXT NOT NULL,
    "localServico" TEXT,
    "status" TEXT NOT NULL DEFAULT 'agendada',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Escala_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RAS" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dataAgendada" TIMESTAMP(3) NOT NULL,
    "dataRealizada" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'agendada',
    "valor" DOUBLE PRECISION NOT NULL,
    "observacoes" TEXT,
    "meses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RAS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lancamento" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "recorrenciaId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmada',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lancamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investimento" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "precoMedio" DOUBLE PRECISION NOT NULL,
    "precoAtual" DOUBLE PRECISION,
    "valor" DOUBLE PRECISION NOT NULL,
    "dataCompra" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meta" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valorAlvo" DOUBLE PRECISION NOT NULL,
    "valorAtual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataAlvo" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'em_progresso',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recorrencia" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "frequencia" TEXT NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recorrencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conta" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "saldoAtual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "banco" TEXT,
    "agencia" TEXT,
    "numero" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_cpf_key" ON "User"("cpf");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_cpf_idx" ON "User"("cpf");

-- CreateIndex
CREATE INDEX "Escala_userId_idx" ON "Escala"("userId");

-- CreateIndex
CREATE INDEX "Escala_dataEscala_idx" ON "Escala"("dataEscala");

-- CreateIndex
CREATE INDEX "RAS_userId_idx" ON "RAS"("userId");

-- CreateIndex
CREATE INDEX "RAS_dataAgendada_idx" ON "RAS"("dataAgendada");

-- CreateIndex
CREATE INDEX "RAS_status_idx" ON "RAS"("status");

-- CreateIndex
CREATE INDEX "Lancamento_userId_idx" ON "Lancamento"("userId");

-- CreateIndex
CREATE INDEX "Lancamento_contaId_idx" ON "Lancamento"("contaId");

-- CreateIndex
CREATE INDEX "Lancamento_data_idx" ON "Lancamento"("data");

-- CreateIndex
CREATE INDEX "Lancamento_categoria_idx" ON "Lancamento"("categoria");

-- CreateIndex
CREATE INDEX "Investimento_userId_idx" ON "Investimento"("userId");

-- CreateIndex
CREATE INDEX "Investimento_tipo_idx" ON "Investimento"("tipo");

-- CreateIndex
CREATE INDEX "Meta_userId_idx" ON "Meta"("userId");

-- CreateIndex
CREATE INDEX "Meta_status_idx" ON "Meta"("status");

-- CreateIndex
CREATE INDEX "Recorrencia_userId_idx" ON "Recorrencia"("userId");

-- CreateIndex
CREATE INDEX "Recorrencia_ativa_idx" ON "Recorrencia"("ativa");

-- CreateIndex
CREATE INDEX "Conta_userId_idx" ON "Conta"("userId");

-- CreateIndex
CREATE INDEX "Conta_ativa_idx" ON "Conta"("ativa");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Escala" ADD CONSTRAINT "Escala_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RAS" ADD CONSTRAINT "RAS_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_recorrenciaId_fkey" FOREIGN KEY ("recorrenciaId") REFERENCES "Recorrencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investimento" ADD CONSTRAINT "Investimento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meta" ADD CONSTRAINT "Meta_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recorrencia" ADD CONSTRAINT "Recorrencia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recorrencia" ADD CONSTRAINT "Recorrencia_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conta" ADD CONSTRAINT "Conta_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
