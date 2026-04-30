-- CreateTable
CREATE TABLE "InvestimentoAtivo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "moeda" TEXT NOT NULL,
    "corretora" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestimentoAtivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestimentoOperacao" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ativoId" TEXT NOT NULL,
    "contaId" TEXT,
    "tipo" TEXT NOT NULL,
    "quantidadeDecimal" TEXT NOT NULL,
    "precoUnitarioCentavos" INTEGER NOT NULL,
    "valorTotalCentavos" INTEGER NOT NULL,
    "taxasCentavos" INTEGER NOT NULL DEFAULT 0,
    "dataOperacao" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmada',
    "lancamentoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestimentoOperacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvestimentoAtivo_userId_idx" ON "InvestimentoAtivo"("userId");

-- CreateIndex
CREATE INDEX "InvestimentoAtivo_tipo_idx" ON "InvestimentoAtivo"("tipo");

-- CreateIndex
CREATE INDEX "InvestimentoAtivo_ativo_idx" ON "InvestimentoAtivo"("ativo");

-- CreateIndex
CREATE INDEX "InvestimentoOperacao_userId_idx" ON "InvestimentoOperacao"("userId");

-- CreateIndex
CREATE INDEX "InvestimentoOperacao_tipo_idx" ON "InvestimentoOperacao"("tipo");

-- CreateIndex
CREATE INDEX "InvestimentoOperacao_ativoId_idx" ON "InvestimentoOperacao"("ativoId");

-- CreateIndex
CREATE INDEX "InvestimentoOperacao_contaId_idx" ON "InvestimentoOperacao"("contaId");

-- CreateIndex
CREATE INDEX "InvestimentoOperacao_lancamentoId_idx" ON "InvestimentoOperacao"("lancamentoId");

-- CreateIndex
CREATE INDEX "InvestimentoOperacao_userId_status_idx" ON "InvestimentoOperacao"("userId", "status");

-- AddForeignKey
ALTER TABLE "InvestimentoAtivo" ADD CONSTRAINT "InvestimentoAtivo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestimentoOperacao" ADD CONSTRAINT "InvestimentoOperacao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestimentoOperacao" ADD CONSTRAINT "InvestimentoOperacao_ativoId_fkey" FOREIGN KEY ("ativoId") REFERENCES "InvestimentoAtivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestimentoOperacao" ADD CONSTRAINT "InvestimentoOperacao_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestimentoOperacao" ADD CONSTRAINT "InvestimentoOperacao_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "Lancamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
