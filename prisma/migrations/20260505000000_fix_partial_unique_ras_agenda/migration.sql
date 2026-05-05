-- Drop the old unique constraint that doesn't account for soft deletes
ALTER TABLE "RasAgenda" DROP CONSTRAINT IF EXISTS "unique_user_data_hora";

-- Create a partial unique index that only applies to active (non-soft-deleted) records
-- This allows soft-deleted records to no longer block new schedules with the same date/time
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_data_hora_active"
ON "RasAgenda"("userId", "data", "horaInicio")
WHERE "deletadoEm" IS NULL;
