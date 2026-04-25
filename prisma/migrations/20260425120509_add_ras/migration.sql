/*
  Warnings:

  - You are about to drop the `RAS` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RAS" DROP CONSTRAINT "RAS_userId_fkey";

-- DropTable
DROP TABLE "RAS";

-- CreateTable
CREATE TABLE "RasAgenda" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "duracao" INTEGER NOT NULL,
    "local" TEXT NOT NULL,
    "graduacao" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'agendado',
    "competencia" TEXT NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RasAgenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RasAgendamento" (
    "id" TEXT NOT NULL,
    "rasAgendaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'agendado',
    "dataRealizacao" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RasAgendamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RasPagamento" (
    "id" TEXT NOT NULL,
    "rasAgendaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "competencia" TEXT NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "comprovante" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RasPagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RasCenarioSalvo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "mes" TEXT NOT NULL,
    "graduacao" TEXT NOT NULL,
    "eventos" JSONB NOT NULL,
    "totalHoras" INTEGER NOT NULL,
    "totalCentavos" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RasCenarioSalvo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RasAgenda_userId_idx" ON "RasAgenda"("userId");

-- CreateIndex
CREATE INDEX "RasAgenda_data_idx" ON "RasAgenda"("data");

-- CreateIndex
CREATE INDEX "RasAgenda_status_idx" ON "RasAgenda"("status");

-- CreateIndex
CREATE INDEX "RasAgenda_competencia_idx" ON "RasAgenda"("competencia");

-- CreateIndex
CREATE UNIQUE INDEX "RasAgenda_userId_data_horaInicio_key" ON "RasAgenda"("userId", "data", "horaInicio");

-- CreateIndex
CREATE INDEX "RasAgendamento_rasAgendaId_idx" ON "RasAgendamento"("rasAgendaId");

-- CreateIndex
CREATE INDEX "RasAgendamento_userId_idx" ON "RasAgendamento"("userId");

-- CreateIndex
CREATE INDEX "RasAgendamento_status_idx" ON "RasAgendamento"("status");

-- CreateIndex
CREATE INDEX "RasPagamento_rasAgendaId_idx" ON "RasPagamento"("rasAgendaId");

-- CreateIndex
CREATE INDEX "RasPagamento_userId_idx" ON "RasPagamento"("userId");

-- CreateIndex
CREATE INDEX "RasPagamento_competencia_idx" ON "RasPagamento"("competencia");

-- CreateIndex
CREATE INDEX "RasCenarioSalvo_userId_idx" ON "RasCenarioSalvo"("userId");

-- CreateIndex
CREATE INDEX "RasCenarioSalvo_mes_idx" ON "RasCenarioSalvo"("mes");

-- CreateIndex
CREATE INDEX "Escala_status_idx" ON "Escala"("status");

-- AddForeignKey
ALTER TABLE "RasAgenda" ADD CONSTRAINT "RasAgenda_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RasAgendamento" ADD CONSTRAINT "RasAgendamento_rasAgendaId_fkey" FOREIGN KEY ("rasAgendaId") REFERENCES "RasAgenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RasAgendamento" ADD CONSTRAINT "RasAgendamento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RasPagamento" ADD CONSTRAINT "RasPagamento_rasAgendaId_fkey" FOREIGN KEY ("rasAgendaId") REFERENCES "RasAgenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RasPagamento" ADD CONSTRAINT "RasPagamento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RasCenarioSalvo" ADD CONSTRAINT "RasCenarioSalvo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
