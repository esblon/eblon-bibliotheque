import type { MigrationBuilder, Name } from "node-pg-migrate"

function schemaName(): string {
  const value = process.env.DATABASE_SCHEMA ?? "eblon_bibliotheque"
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) {
    throw new Error("DATABASE_SCHEMA is invalid")
  }
  return value
}

function table(schema: string, name: string): Name {
  return { schema, name }
}

export function up(pgm: MigrationBuilder): void {
  const schema = schemaName()
  const subjects = table(schema, "subjects")
  const educationLevels = table(schema, "education_levels")
  const books = table(schema, "books")
  const bookCopies = table(schema, "book_copies")
  const borrowers = table(schema, "borrowers")
  const staffMembers = table(schema, "staff_members")
  const loans = table(schema, "loans")
  const loanEvents = table(schema, "loan_events")

  pgm.createTable(subjects, {
    id: { type: "uuid", primaryKey: true },
    code: { type: "text", notNull: true, unique: true },
    name: { type: "text", notNull: true },
    is_active: { type: "boolean", notNull: true, default: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
  })
  pgm.addConstraint(subjects, "subjects_code_not_blank", { check: "btrim(code) <> ''" })
  pgm.addConstraint(subjects, "subjects_name_not_blank", { check: "btrim(name) <> ''" })

  pgm.createTable(educationLevels, {
    id: { type: "uuid", primaryKey: true },
    code: { type: "text", notNull: true, unique: true },
    name: { type: "text", notNull: true },
    is_active: { type: "boolean", notNull: true, default: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
  })
  pgm.addConstraint(educationLevels, "education_levels_code_not_blank", { check: "btrim(code) <> ''" })
  pgm.addConstraint(educationLevels, "education_levels_name_not_blank", { check: "btrim(name) <> ''" })

  pgm.createTable(books, {
    id: { type: "uuid", primaryKey: true },
    title: { type: "text", notNull: true },
    subtitle: { type: "text" },
    isbn: { type: "text" },
    publisher: { type: "text" },
    edition: { type: "text" },
    publication_year: { type: "integer" },
    description: { type: "text" },
    subject_id: { type: "uuid", notNull: true, references: subjects, onDelete: "RESTRICT" },
    education_level_id: { type: "uuid", notNull: true, references: educationLevels, onDelete: "RESTRICT" },
    cover_image_key: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
  })
  pgm.addConstraint(books, "books_title_not_blank", { check: "btrim(title) <> ''" })
  pgm.addConstraint(books, "books_publication_year_valid", {
    check: "publication_year IS NULL OR publication_year BETWEEN 1000 AND 9999",
  })
  pgm.createIndex(books, "subject_id")
  pgm.createIndex(books, "education_level_id")
  pgm.createIndex(books, "isbn", { unique: true, where: "isbn IS NOT NULL" })

  pgm.createTable(bookCopies, {
    id: { type: "uuid", primaryKey: true },
    book_id: { type: "uuid", notNull: true, references: books, onDelete: "RESTRICT" },
    inventory_code: { type: "text", notNull: true, unique: true },
    qr_code: { type: "text" },
    status: { type: "text", notNull: true, default: "PLANNED" },
    acquisition_date: { type: "date" },
    acquisition_price: { type: "numeric(12,2)" },
    currency: { type: "char(3)" },
    notes: { type: "text" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
  })
  pgm.addConstraint(bookCopies, "book_copies_inventory_code_not_blank", { check: "btrim(inventory_code) <> ''" })
  pgm.addConstraint(bookCopies, "book_copies_status_valid", {
    check: "status IN ('PLANNED','PURCHASED','TO_LABEL','LABELED','AVAILABLE','BORROWED','LOST','DAMAGED','RETIRED')",
  })
  pgm.addConstraint(bookCopies, "book_copies_acquisition_price_valid", {
    check: "acquisition_price IS NULL OR acquisition_price >= 0",
  })
  pgm.addConstraint(bookCopies, "book_copies_price_currency_consistent", {
    check: "(acquisition_price IS NULL AND currency IS NULL) OR (acquisition_price IS NOT NULL AND currency ~ '^[A-Z]{3}$')",
  })
  pgm.createIndex(bookCopies, "book_id")
  pgm.createIndex(bookCopies, "status")
  pgm.createIndex(bookCopies, "qr_code", { unique: true, where: "qr_code IS NOT NULL" })

  pgm.createTable(borrowers, {
    id: { type: "uuid", primaryKey: true },
    borrower_number: { type: "text", notNull: true, unique: true },
    first_name: { type: "text", notNull: true },
    last_name: { type: "text", notNull: true },
    email: { type: "text" },
    phone: { type: "text" },
    education_level_id: { type: "uuid", references: educationLevels, onDelete: "RESTRICT" },
    class_name: { type: "text" },
    school_name: { type: "text" },
    status: { type: "text", notNull: true, default: "ACTIVE" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
  })
  pgm.addConstraint(borrowers, "borrowers_number_not_blank", { check: "btrim(borrower_number) <> ''" })
  pgm.addConstraint(borrowers, "borrowers_names_not_blank", {
    check: "btrim(first_name) <> '' AND btrim(last_name) <> ''",
  })
  pgm.addConstraint(borrowers, "borrowers_status_valid", {
    check: "status IN ('ACTIVE','SUSPENDED','ARCHIVED')",
  })
  pgm.createIndex(borrowers, "education_level_id")
  pgm.createIndex(borrowers, "status")

  pgm.createTable(staffMembers, {
    id: { type: "uuid", primaryKey: true },
    external_auth_id: { type: "text", unique: true },
    first_name: { type: "text", notNull: true },
    last_name: { type: "text", notNull: true },
    email: { type: "text", notNull: true, unique: true },
    role: { type: "text", notNull: true },
    status: { type: "text", notNull: true, default: "ACTIVE" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
  })
  pgm.addConstraint(staffMembers, "staff_members_names_not_blank", {
    check: "btrim(first_name) <> '' AND btrim(last_name) <> ''",
  })
  pgm.addConstraint(staffMembers, "staff_members_email_not_blank", { check: "btrim(email) <> ''" })
  pgm.addConstraint(staffMembers, "staff_members_role_valid", {
    check: "role IN ('ADMIN','TEACHER','LIBRARIAN','VIEWER')",
  })
  pgm.addConstraint(staffMembers, "staff_members_status_valid", {
    check: "status IN ('ACTIVE','DISABLED')",
  })

  pgm.createTable(loans, {
    id: { type: "uuid", primaryKey: true },
    book_copy_id: { type: "uuid", notNull: true, references: bookCopies, onDelete: "RESTRICT" },
    borrower_id: { type: "uuid", notNull: true, references: borrowers, onDelete: "RESTRICT" },
    issued_by_staff_id: { type: "uuid", notNull: true, references: staffMembers, onDelete: "RESTRICT" },
    returned_to_staff_id: { type: "uuid", references: staffMembers, onDelete: "RESTRICT" },
    loaned_at: { type: "timestamptz", notNull: true },
    due_at: { type: "timestamptz", notNull: true },
    returned_at: { type: "timestamptz" },
    status: { type: "text", notNull: true, default: "ACTIVE" },
    return_condition: { type: "text" },
    notes: { type: "text" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
  })
  pgm.addConstraint(loans, "loans_status_valid", {
    check: "status IN ('ACTIVE','RETURNED','OVERDUE','LOST','CANCELLED')",
  })
  pgm.addConstraint(loans, "loans_due_after_loaned", { check: "due_at > loaned_at" })
  pgm.addConstraint(loans, "loans_returned_after_loaned", {
    check: "returned_at IS NULL OR returned_at >= loaned_at",
  })
  pgm.addConstraint(loans, "loans_return_status_consistent", {
    check: "(status = 'RETURNED' AND returned_at IS NOT NULL AND returned_to_staff_id IS NOT NULL) OR (status IN ('ACTIVE','OVERDUE','LOST','CANCELLED') AND returned_at IS NULL)",
  })
  pgm.createIndex(loans, "borrower_id")
  pgm.createIndex(loans, "issued_by_staff_id")
  pgm.createIndex(loans, "returned_to_staff_id")
  pgm.createIndex(loans, ["status", "due_at"])
  pgm.sql(`
    CREATE UNIQUE INDEX loans_one_open_per_copy_idx
      ON "${schema}"."loans" (book_copy_id)
      WHERE status IN ('ACTIVE', 'OVERDUE');
  `)

  pgm.createTable(loanEvents, {
    id: { type: "uuid", primaryKey: true },
    loan_id: { type: "uuid", notNull: true, references: loans, onDelete: "RESTRICT" },
    event_type: { type: "text", notNull: true },
    performed_by_staff_id: { type: "uuid", references: staffMembers, onDelete: "RESTRICT" },
    event_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
    details: { type: "jsonb" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
  })
  pgm.addConstraint(loanEvents, "loan_events_type_valid", {
    check: "event_type IN ('CREATED','EXTENDED','RETURNED','MARKED_OVERDUE','MARKED_LOST','CANCELLED','NOTE_ADDED')",
  })
  pgm.createIndex(loanEvents, ["loan_id", "event_at"])
  pgm.createIndex(loanEvents, "performed_by_staff_id")

  pgm.sql(`
    CREATE FUNCTION "${schema}".prevent_loan_event_mutation()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RAISE EXCEPTION 'loan_events is append-only';
    END;
    $$;

    CREATE TRIGGER loan_events_immutable
    BEFORE UPDATE OR DELETE ON "${schema}".loan_events
    FOR EACH ROW EXECUTE FUNCTION "${schema}".prevent_loan_event_mutation();

    COMMENT ON TABLE "${schema}".books IS 'Intellectual works, independent from physical copies';
    COMMENT ON TABLE "${schema}".book_copies IS 'Physical inventory items identified by inventory and optional QR codes';
    COMMENT ON TABLE "${schema}".loans IS 'Current and historical loans of physical book copies';
    COMMENT ON TABLE "${schema}".loan_events IS 'Append-only audit trail for loan lifecycle events';
    COMMENT ON COLUMN "${schema}".staff_members.external_auth_id IS 'Future external identity identifier, for example Amazon Cognito sub';
    COMMENT ON COLUMN "${schema}".books.cover_image_key IS 'Portable object-storage key; no provider-specific URL';
  `)
}

export function down(pgm: MigrationBuilder): void {
  const schema = schemaName()

  pgm.dropTable(table(schema, "loan_events"))
  pgm.dropFunction({ schema, name: "prevent_loan_event_mutation" }, [], { ifExists: true })
  pgm.dropTable(table(schema, "loans"))
  pgm.dropTable(table(schema, "staff_members"))
  pgm.dropTable(table(schema, "borrowers"))
  pgm.dropTable(table(schema, "book_copies"))
  pgm.dropTable(table(schema, "books"))
  pgm.dropTable(table(schema, "education_levels"))
  pgm.dropTable(table(schema, "subjects"))
}
