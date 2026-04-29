-- Fase 6D.2: MVP de recorrencias financeiras.
-- Mantem Recorrencia como template e Lancamento como fato financeiro.

ALTER TABLE "Recorrencia"
ADD COLUMN "categoriaId" TEXT,
ADD COLUMN "proximaExecucao" TIMESTAMP(3),
ADD COLUMN "ultimaExecucao" TIMESTAMP(3);

CREATE UNIQUE INDEX "Lancamento_userId_recorrenciaId_competenciaAt_key"
ON "Lancamento"("userId", "recorrenciaId", "competenciaAt");

CREATE INDEX "Recorrencia_categoriaId_idx"
ON "Recorrencia"("categoriaId");

ALTER TABLE "Recorrencia"
ADD CONSTRAINT "Recorrencia_categoriaId_fkey"
FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
