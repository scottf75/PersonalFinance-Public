-- Add CategoryType to Category table
-- CategoryType: 1 = Income, 2 = Expense

ALTER TABLE category ADD COLUMN categorytype INT NOT NULL DEFAULT 2;

-- Create index for filtering by type
CREATE INDEX idx_category_type ON category(categorytype);

-- Update common income categories (if they exist)
UPDATE category SET categorytype = 1 WHERE LOWER(name) LIKE '%income%';
UPDATE category SET categorytype = 1 WHERE LOWER(name) LIKE '%salary%';
UPDATE category SET categorytype = 1 WHERE LOWER(name) LIKE '%paycheck%';
UPDATE category SET categorytype = 1 WHERE LOWER(name) LIKE '%dividend%';
UPDATE category SET categorytype = 1 WHERE LOWER(name) LIKE '%interest%';
UPDATE category SET categorytype = 1 WHERE LOWER(name) LIKE '%refund%';
UPDATE category SET categorytype = 1 WHERE LOWER(name) LIKE '%reimbursement%';
