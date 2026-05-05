-- AlterTable: add soft-delete fields to RasAgenda
ALTER TABLE "RasAgenda" ADD COLUMN IF NOT EXISTS "deletadoEm" TIMESTAMP(3);
ALTER TABLE "RasAgenda" ADD COLUMN IF NOT EXISTS "motivoDelecao" TEXT;

-- CreateTable: RasAuditLog
CREATE TABLE IF NOT EXISTS "RasAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rasAgendaId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "motivoDelecao" TEXT,
    "dadosAntes" JSONB,
    "dadosDepois" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RasAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: soft-delete optimized indexes on RasAgenda
CREATE INDEX IF NOT EXISTS "idx_user_ativo" ON "RasAgenda"("userId", "deletadoEm");
CREATE INDEX IF NOT EXISTS "idx_data_ativo" ON "RasAgenda"("data", "deletadoEm");
CREATE INDEX IF NOT EXISTS "idx_status_ativo" ON "RasAgenda"("status", "deletadoEm");
CREATE INDEX IF NOT EXISTS "idx_competencia_ativo" ON "RasAgenda"("competencia", "deletadoEm");
CREATE INDEX IF NOT EXISTS "idx_soft_deletes" ON "RasAgenda"("deletadoEm");
CREATE INDEX IF NOT EXISTS "idx_created_for_pagination" ON "RasAgenda"("createdAt");

-- CreateIndex: RasAuditLog indexes
CREATE INDEX IF NOT EXISTS "RasAuditLog_userId_idx" ON "RasAuditLog"("userId");
CREATE INDEX IF NOT EXISTS "RasAuditLog_rasAgendaId_idx" ON "RasAuditLog"("rasAgendaId");
CREATE INDEX IF NOT EXISTS "RasAuditLog_acao_idx" ON "RasAuditLog"("acao");
CREATE INDEX IF NOT EXISTS "RasAuditLog_createdAt_idx" ON "RasAuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "RasAuditLog_userId_createdAt_idx" ON "RasAuditLog"("userId", "createdAt");

-- AddForeignKey: RasAuditLog → User
ALTER TABLE "RasAuditLog" DROP CONSTRAINT IF EXISTS "RasAuditLog_userId_fkey";
ALTER TABLE "RasAuditLog" ADD CONSTRAINT "RasAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: RasAuditLog → RasAgenda
ALTER TABLE "RasAuditLog" DROP CONSTRAINT IF EXISTS "RasAuditLog_rasAgendaId_fkey";
ALTER TABLE "RasAuditLog" ADD CONSTRAINT "RasAuditLog_rasAgendaId_fkey" FOREIGN KEY ("rasAgendaId") REFERENCES "RasAgenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
