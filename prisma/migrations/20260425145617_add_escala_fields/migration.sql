-- AlterTable
ALTER TABLE "Escala" ADD COLUMN     "alarmeAtivo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "horaFim" TEXT NOT NULL DEFAULT '19:00',
ADD COLUMN     "horaInicio" TEXT NOT NULL DEFAULT '07:00',
ADD COLUMN     "observacoes" TEXT;
