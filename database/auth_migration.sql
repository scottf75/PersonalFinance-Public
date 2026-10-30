-- Authentication Migration Script
-- Adds multi-user support with local and social authentication

-- =============================================
-- Step 1: Create User table
-- =============================================
CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    passwordhash VARCHAR(255),              -- NULL for social-only users
    firstname VARCHAR(100),
    lastname VARCHAR(100),
    avatarurl VARCHAR(500),                 -- Profile picture from social provider
    emailverified BOOLEAN DEFAULT FALSE,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_email ON "user"(email);

-- =============================================
-- Step 2: Create External Logins table (Social Providers)
-- =============================================
CREATE TABLE externallogin (
    id SERIAL PRIMARY KEY,
    userid INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,          -- 'google', 'microsoft', 'github'
    providerid VARCHAR(255) NOT NULL,       -- User ID from provider
    provideremail VARCHAR(255),
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, providerid)
);

CREATE INDEX idx_externallogin_userid ON externallogin(userid);
CREATE INDEX idx_externallogin_provider ON externallogin(provider, providerid);

-- =============================================
-- Step 3: Create Refresh Tokens table
-- =============================================
CREATE TABLE refreshtoken (
    id SERIAL PRIMARY KEY,
    userid INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    deviceinfo VARCHAR(255),                -- Browser/device identifier
    ipaddress VARCHAR(45),
    expiresat TIMESTAMP NOT NULL,
    revokedat TIMESTAMP,                    -- For manual revocation
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refreshtoken_userid ON refreshtoken(userid);
CREATE INDEX idx_refreshtoken_token ON refreshtoken(token);

-- =============================================
-- Step 4: Add UserId to existing tables
-- =============================================

-- Account table
ALTER TABLE account ADD COLUMN userid INTEGER REFERENCES "user"(id);
CREATE INDEX idx_account_userid ON account(userid);

-- Category table
ALTER TABLE category ADD COLUMN userid INTEGER REFERENCES "user"(id);
CREATE INDEX idx_category_userid ON category(userid);

-- Budget table
ALTER TABLE budget ADD COLUMN userid INTEGER REFERENCES "user"(id);
CREATE INDEX idx_budget_userid ON budget(userid);

-- BudgetPlan table
ALTER TABLE budgetplan ADD COLUMN userid INTEGER REFERENCES "user"(id);
CREATE INDEX idx_budgetplan_userid ON budgetplan(userid);

-- TellerEnrollment table
ALTER TABLE tellerenrollment ADD COLUMN userid INTEGER REFERENCES "user"(id);
CREATE INDEX idx_tellerenrollment_userid ON tellerenrollment(userid);

-- Setting table
ALTER TABLE setting ADD COLUMN userid INTEGER REFERENCES "user"(id);
CREATE INDEX idx_setting_userid ON setting(userid);

-- Transaction table
ALTER TABLE "transaction" ADD COLUMN userid INTEGER REFERENCES "user"(id);
CREATE INDEX idx_transaction_userid ON "transaction"(userid);

-- =============================================
-- Step 5: Migration for existing data (run manually if data exists)
-- =============================================
-- If you have existing data, run these steps:
--
-- 1. Create a default user:
-- INSERT INTO "user" (email, passwordhash, firstname, emailverified)
-- VALUES ('admin@example.com', '$2a$12$...hashed_password...', 'Admin', true)
-- RETURNING id;
--
-- 2. Assign existing data to the default user (replace 1 with actual user id):
-- UPDATE account SET userid = 1 WHERE userid IS NULL;
-- UPDATE category SET userid = 1 WHERE userid IS NULL;
-- UPDATE budget SET userid = 1 WHERE userid IS NULL;
-- UPDATE budgetplan SET userid = 1 WHERE userid IS NULL;
-- UPDATE tellerenrollment SET userid = 1 WHERE userid IS NULL;
-- UPDATE setting SET userid = 1 WHERE userid IS NULL;
-- UPDATE "transaction" SET userid = 1 WHERE userid IS NULL;
--
-- 3. After migration, make userid NOT NULL:
-- ALTER TABLE account ALTER COLUMN userid SET NOT NULL;
-- ALTER TABLE category ALTER COLUMN userid SET NOT NULL;
-- ALTER TABLE budget ALTER COLUMN userid SET NOT NULL;
-- ALTER TABLE budgetplan ALTER COLUMN userid SET NOT NULL;
-- ALTER TABLE tellerenrollment ALTER COLUMN userid SET NOT NULL;
-- ALTER TABLE setting ALTER COLUMN userid SET NOT NULL;
-- ALTER TABLE "transaction" ALTER COLUMN userid SET NOT NULL;
