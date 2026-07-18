import type { MigrationBuilder } from "node-pg-migrate"

function schemaName(): string {
  const value = process.env.DATABASE_SCHEMA ?? "eblon_bibliotheque"
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) throw new Error("DATABASE_SCHEMA is invalid")
  return value
}

export function up(pgm: MigrationBuilder): void {
  const schema = schemaName()
  pgm.createSchema(schema, { ifNotExists: true })
  pgm.createTable(
    { schema, name: "foundation_status" },
    {
      id: { type: "smallint", primaryKey: true },
      migrated_at: {
        type: "timestamptz",
        notNull: true,
        default: pgm.func("current_timestamp"),
      },
    },
    { ifNotExists: true },
  )
}

export function down(pgm: MigrationBuilder): void {
  const schema = schemaName()
  pgm.dropTable({ schema, name: "foundation_status" }, { ifExists: true })
  pgm.dropSchema(schema, { ifExists: true })
}
