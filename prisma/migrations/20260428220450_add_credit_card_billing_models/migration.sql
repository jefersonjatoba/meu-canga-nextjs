-- AlterTable
ALTER TABLE "Investimento" ALTER COLUMN "precoMedioCentavos" DROP DEFAULT,
ALTER COLUMN "valorCentavos" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Lancamento" ALTER COLUMN "valorCentavos" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Meta" ALTER COLUMN "valorAlvoCentavos" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Recorrencia" ALTER COLUMN "valorCentavos" DROP DEFAULT;

-- CreateTable
CREATE TABLE "FaturaCartao" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "competencia" TEXT NOT NULL,
    "dataFechamento" TIMESTAMP(3) NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aberta',
    "totalCentavos" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaturaCartao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompraCartao" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "categoriaId" TEXT,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorTotalCentavos" INTEGER NOT NULL,
    "dataCompra" TIMESTAMP(3) NOT NULL,
    "quantidadeParcelas" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ativa',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompraCartao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParcelaCartao" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "compraCartaoId" TEXT NOT NULL,
    "faturaCartaoId" TEXT NOT NULL,
    "lancamentoId" TEXT,
    "numero" INTEGER NOT NULL,
    "totalParcelas" INTEGER NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "competencia" TEXT NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'prevista',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParcelaCartao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagamentoFatura" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "faturaCartaoId" TEXT NOT NULL,
    "contaPagamentoId" TEXT NOT NULL,
    "lancamentoId" TEXT,
    "valorCentavos" INTEGER NOT NULL,
    "dataPagamento" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmado',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PagamentoFatura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FaturaCartao_userId_idx" ON "FaturaCartao"("userId");

-- CreateIndex
CREATE INDEX "FaturaCartao_contaId_idx" ON "FaturaCartao"("contaId");

-- CreateIndex
CREATE INDEX "FaturaCartao_userId_status_idx" ON "FaturaCartao"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FaturaCartao_contaId_competencia_key" ON "FaturaCartao"("contaId", "competencia");

-- CreateIndex
CREATE INDEX "CompraCartao_userId_idx" ON "CompraCartao"("userId");

-- CreateIndex
CREATE INDEX "CompraCartao_contaId_idx" ON "CompraCartao"("contaId");

-- CreateIndex
CREATE INDEX "CompraCartao_categoriaId_idx" ON "CompraCartao"("categoriaId");

-- CreateIndex
CREATE INDEX "CompraCartao_userId_status_idx" ON "CompraCartao"("userId", "status");

-- CreateIndex
CREATE INDEX "ParcelaCartao_userId_idx" ON "ParcelaCartao"("userId");

-- CreateIndex
CREATE INDEX "ParcelaCartao_compraCartaoId_idx" ON "ParcelaCartao"("compraCartaoId");

-- CreateIndex
CREATE INDEX "ParcelaCartao_faturaCartaoId_idx" ON "ParcelaCartao"("faturaCartaoId");

-- CreateIndex
CREATE INDEX "ParcelaCartao_lancamentoId_idx" ON "ParcelaCartao"("lancamentoId");

-- CreateIndex
CREATE INDEX "ParcelaCartao_userId_competencia_idx" ON "ParcelaCartao"("userId", "competencia");

-- CreateIndex
CREATE UNIQUE INDEX "ParcelaCartao_compraCartaoId_numero_key" ON "ParcelaCartao"("compraCartaoId", "numero");

-- CreateIndex
CREATE INDEX "PagamentoFatura_userId_idx" ON "PagamentoFatura"("userId");

-- CreateIndex
CREATE INDEX "PagamentoFatura_faturaCartaoId_idx" ON "PagamentoFatura"("faturaCartaoId");

-- CreateIndex
CREATE INDEX "PagamentoFatura_contaPagamentoId_idx" ON "PagamentoFatura"("contaPagamentoId");

-- CreateIndex
CREATE INDEX "PagamentoFatura_lancamentoId_idx" ON "PagamentoFatura"("lancamentoId");

-- CreateIndex
CREATE INDEX "PagamentoFatura_userId_dataPagamento_idx" ON "PagamentoFatura"("userId", "dataPagamento");

-- AddForeignKey
ALTER TABLE "FaturaCartao" ADD CONSTRAINT "FaturaCartao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaturaCartao" ADD CONSTRAINT "FaturaCartao_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraCartao" ADD CONSTRAINT "CompraCartao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraCartao" ADD CONSTRAINT "CompraCartao_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraCartao" ADD CONSTRAINT "CompraCartao_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParcelaCartao" ADD CONSTRAINT "ParcelaCartao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParcelaCartao" ADD CONSTRAINT "ParcelaCartao_compraCartaoId_fkey" FOREIGN KEY ("compraCartaoId") REFERENCES "CompraCartao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParcelaCartao" ADD CONSTRAINT "ParcelaCartao_faturaCartaoId_fkey" FOREIGN KEY ("faturaCartaoId") REFERENCES "FaturaCartao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParcelaCartao" ADD CONSTRAINT "ParcelaCartao_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "Lancamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagamentoFatura" ADD CONSTRAINT "PagamentoFatura_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagamentoFatura" ADD CONSTRAINT "PagamentoFatura_faturaCartaoId_fkey" FOREIGN KEY ("faturaCartaoId") REFERENCES "FaturaCartao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagamentoFatura" ADD CONSTRAINT "PagamentoFatura_contaPagamentoId_fkey" FOREIGN KEY ("contaPagamentoId") REFERENCES "Conta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagamentoFatura" ADD CONSTRAINT "PagamentoFatura_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "Lancamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
