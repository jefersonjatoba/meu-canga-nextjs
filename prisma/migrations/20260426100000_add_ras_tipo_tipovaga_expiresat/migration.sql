-- AlterTable: add tipo, tipoVaga, expiresAt to RasAgenda
ALTER TABLE "RasAgenda" ADD COLUMN "tipo" TEXT NOT NULL DEFAULT 'voluntario';
ALTER TABLE "RasAgenda" ADD COLUMN "tipoVaga" TEXT NOT NULL DEFAULT 'titular';
ALTER TABLE "RasAgenda" ADD COLUMN "expiresAt" TIMESTAMP(3);
