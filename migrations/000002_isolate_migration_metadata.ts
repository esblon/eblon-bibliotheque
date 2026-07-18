import type { MigrationBuilder } from "node-pg-migrate"

export function up(pgm: MigrationBuilder): void {
  pgm.sql(`
    DO $$
    BEGIN
      IF to_regclass('public.pgmigrations') IS NOT NULL THEN
        IF EXISTS (
          SELECT 1
          FROM public.pgmigrations
          WHERE name <> '000001_foundation'
        ) THEN
          RAISE EXCEPTION
            'public.pgmigrations contains migrations not owned by EBLON BIBLIOTHÈQUE';
        END IF;

        DROP TABLE public.pgmigrations;
      END IF;
    END
    $$;
  `)
}

export function down(): void {
  throw new Error(
    "The legacy shared migration table cannot be restored safely",
  )
}
