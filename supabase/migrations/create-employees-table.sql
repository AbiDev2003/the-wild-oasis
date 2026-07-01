CREATE TABLE employees (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_select_authenticated"
  ON employees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "employees_insert_authenticated"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
