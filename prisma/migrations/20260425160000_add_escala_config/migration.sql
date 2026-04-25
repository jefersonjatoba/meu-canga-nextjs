-- CreateTable
CREATE TABLE "EscalaConfig" (
    "userId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "inicioCiclo" TEXT NOT NULL,
    "localServico" TEXT,
    "alarmeAtivo" BOOLEAN NOT NULL DEFAULT true,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscalaConfig_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "EscalaConfig" ADD CONSTRAINT "EscalaConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
