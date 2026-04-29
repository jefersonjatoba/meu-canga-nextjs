-- AlterTable
ALTER TABLE "Meta" ADD COLUMN     "cor" TEXT,
ADD COLUMN     "icone" TEXT,
ADD COLUMN     "ordem" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'poupanca',
ADD COLUMN     "valorInicialCentavos" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "dataAlvo" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ativa';

-- CreateTable
CREATE TABLE "MetaAporte" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metaId" TEXT NOT NULL,
    "contaId" TEXT,
    "valorCentavos" INTEGER NOT NULL,
    "dataAporte" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmado',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaAporte_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MetaAporte_userId_idx" ON "MetaAporte"("userId");

-- CreateIndex
CREATE INDEX "MetaAporte_metaId_idx" ON "MetaAporte"("metaId");

-- CreateIndex
CREATE INDEX "MetaAporte_contaId_idx" ON "MetaAporte"("contaId");

-- CreateIndex
CREATE INDEX "MetaAporte_userId_status_idx" ON "MetaAporte"("userId", "status");

-- CreateIndex
CREATE INDEX "MetaAporte_userId_dataAporte_idx" ON "MetaAporte"("userId", "dataAporte");

-- CreateIndex
CREATE INDEX "Meta_userId_status_idx" ON "Meta"("userId", "status");

-- AddForeignKey
ALTER TABLE "MetaAporte" ADD CONSTRAINT "MetaAporte_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaAporte" ADD CONSTRAINT "MetaAporte_metaId_fkey" FOREIGN KEY ("metaId") REFERENCES "Meta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaAporte" ADD CONSTRAINT "MetaAporte_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
