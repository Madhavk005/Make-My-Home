-- Internal follow-up notes are separate from the customer's note so an admin
-- update never overwrites what the customer wrote.

ALTER TABLE enquiries
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;
