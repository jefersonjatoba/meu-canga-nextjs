-- Add persistent categories while preserving Lancamento.categoria string fallback.

CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "icone" TEXT,
    "cor" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Lancamento" ADD COLUMN "categoriaId" TEXT;

CREATE UNIQUE INDEX "Categoria_userId_nome_tipo_key" ON "Categoria"("userId", "nome", "tipo");
CREATE INDEX "Categoria_userId_idx" ON "Categoria"("userId");
CREATE INDEX "Categoria_userId_tipo_idx" ON "Categoria"("userId", "tipo");
CREATE INDEX "Categoria_userId_ativa_idx" ON "Categoria"("userId", "ativa");
CREATE INDEX "Lancamento_categoriaId_idx" ON "Lancamento"("categoriaId");

ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_categoriaId_fkey"
    FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Safe backfill:
-- 1. Create one Categoria per user/name/type found in existing Lancamento rows.
-- 2. Keep Lancamento.categoria untouched.
-- 3. Fill nullable Lancamento.categoriaId only on exact user/name/type matches.
WITH distinct_categories AS (
    SELECT DISTINCT
        "userId",
        "categoria" AS "nome",
        CASE
            WHEN "tipo" = 'income' THEN 'income'
            WHEN "tipo" = 'expense' THEN 'expense'
            ELSE 'both'
        END AS "tipo"
    FROM "Lancamento"
    WHERE "categoria" IS NOT NULL
      AND length(trim("categoria")) > 0
)
INSERT INTO "Categoria" ("id", "userId", "nome", "tipo", "updatedAt")
SELECT
    'cmcg_' || md5("userId" || ':' || "nome" || ':' || "tipo"),
    "userId",
    "nome",
    "tipo",
    CURRENT_TIMESTAMP
FROM distinct_categories
ON CONFLICT ("userId", "nome", "tipo") DO NOTHING;

UPDATE "Lancamento" l
SET "categoriaId" = c."id"
FROM "Categoria" c
WHERE l."categoriaId" IS NULL
  AND c."userId" = l."userId"
  AND c."nome" = l."categoria"
  AND c."tipo" = CASE
      WHEN l."tipo" = 'income' THEN 'income'
      WHEN l."tipo" = 'expense' THEN 'expense'
      ELSE 'both'
  END;
