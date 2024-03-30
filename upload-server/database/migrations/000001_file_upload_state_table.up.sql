-- Create the upload_state table with the State column using the enum type
CREATE TABLE upload_state (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255),
  state INT,
  idempotency_key VARCHAR(255),
  file_path VARCHAR(255),
  file_type VARCHAR(255),
  check_sum VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
