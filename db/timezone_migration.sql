-- Apply timezone consistency for existing databases/volumes.
-- Interprets legacy TIMESTAMP values as UTC and converts to TIMESTAMPTZ.

ALTER DATABASE autopoiesis_db SET timezone TO 'America/La_Paz';
ALTER ROLE admin SET timezone TO 'America/La_Paz';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usuarios'
      AND column_name = 'fecha_creacion'
      AND data_type = 'timestamp without time zone'
  ) THEN
    EXECUTE 'ALTER TABLE usuarios ALTER COLUMN fecha_creacion TYPE TIMESTAMPTZ USING fecha_creacion AT TIME ZONE ''UTC''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'programas'
      AND column_name = 'fecha_creacion'
      AND data_type = 'timestamp without time zone'
  ) THEN
    EXECUTE 'ALTER TABLE programas ALTER COLUMN fecha_creacion TYPE TIMESTAMPTZ USING fecha_creacion AT TIME ZONE ''UTC''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'caracteristicas_demanda_semanal'
      AND column_name = 'registrado_en'
      AND data_type = 'timestamp without time zone'
  ) THEN
    EXECUTE 'ALTER TABLE caracteristicas_demanda_semanal ALTER COLUMN registrado_en TYPE TIMESTAMPTZ USING registrado_en AT TIME ZONE ''UTC''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'predicciones'
      AND column_name = 'predicho_en'
      AND data_type = 'timestamp without time zone'
  ) THEN
    EXECUTE 'ALTER TABLE predicciones ALTER COLUMN predicho_en TYPE TIMESTAMPTZ USING predicho_en AT TIME ZONE ''UTC''';
  END IF;
END $$;
