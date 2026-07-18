import type { MigrationBuilder } from "node-pg-migrate"

function schemas() {
  const metier = process.env.DATABASE_SCHEMA ?? "eblon_bibliotheque"
  if (!/^[a-z_][a-z0-9_]*$/.test(metier)) throw new Error("DATABASE_SCHEMA is invalid")
  return { metier, ancien: `${metier}_auth` }
}

export function up(pgm: MigrationBuilder): void {
  const { metier, ancien } = schemas()
  pgm.sql(`
    ALTER TABLE "${ancien}"."user" SET SCHEMA "${metier}";
    ALTER TABLE "${ancien}"."session" SET SCHEMA "${metier}";
    ALTER TABLE "${ancien}"."account" SET SCHEMA "${metier}";
    ALTER TABLE "${ancien}"."verification" SET SCHEMA "${metier}";
    DROP SCHEMA "${ancien}";
  `)
}

export function down(pgm: MigrationBuilder): void {
  const { metier, ancien } = schemas()
  pgm.sql(`
    CREATE SCHEMA "${ancien}";
    ALTER TABLE "${metier}"."user" SET SCHEMA "${ancien}";
    ALTER TABLE "${metier}"."session" SET SCHEMA "${ancien}";
    ALTER TABLE "${metier}"."account" SET SCHEMA "${ancien}";
    ALTER TABLE "${metier}"."verification" SET SCHEMA "${ancien}";
  `)
}
