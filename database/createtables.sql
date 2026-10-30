CREATE TABLE Category (
    Id SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Description TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Account (
    Id SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Institution VARCHAR(100) NOT NULL,
    AccountType INT NOT NULL,
    Balance DECIMAL(15,2) NOT NULL,
    CreditLimit DECIMAL(15,2) NULL,
    DueDate TIMESTAMP NULL,
    AccountNumber VARCHAR(50) NULL,
    InvestmentType VARCHAR(100) NULL,
    Performance DECIMAL(8,4) NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    LastSyncDate TIMESTAMP NULL,
    IsActive BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_account_type ON Account(AccountType);
CREATE INDEX idx_account_active ON Account(IsActive);

CREATE TABLE "transaction" (
    Id SERIAL PRIMARY KEY,
    Description TEXT NOT NULL,
    Amount DECIMAL(15,2) NOT NULL,
    CategoryId INT NOT NULL,
    AccountId INT NOT NULL,
    TransactionDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CategoryId) REFERENCES Category(Id),
    FOREIGN KEY (AccountId) REFERENCES Account(Id)
);

CREATE INDEX idx_transaction_category ON "transaction"(CategoryId);
CREATE INDEX idx_transaction_account ON "transaction"(AccountId);

-- Add CheckNumber field to transaction table
ALTER TABLE "transaction" ADD COLUMN CheckNumber VARCHAR(20) NULL;

-- Settings table
CREATE TABLE Setting (
    Id SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL UNIQUE,
    Value TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_setting_name ON Setting(Name);

-- Add Icon field to Category table
ALTER TABLE Category ADD COLUMN Icon VARCHAR(10) NULL;

-- Budget table for monthly category budgets
CREATE TABLE Budget (
    Id SERIAL PRIMARY KEY,
    Year INT NOT NULL,
    Month INT NOT NULL,
    CategoryId INT NOT NULL,
    BudgetAmount DECIMAL(15,2) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CategoryId) REFERENCES Category(Id),
    CONSTRAINT unique_budget_period UNIQUE (Year, Month, CategoryId)
);

CREATE INDEX idx_budget_period ON Budget(Year, Month);
CREATE INDEX idx_budget_category ON Budget(CategoryId);

-- Teller.io Bank Sync Integration
CREATE TABLE TellerEnrollment (
    Id SERIAL PRIMARY KEY,
    EnrollmentId VARCHAR(100) NOT NULL UNIQUE,
    AccessToken VARCHAR(500) NOT NULL,
    InstitutionName VARCHAR(100),
    LastSyncAt TIMESTAMP,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    IsActive BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_teller_enrollment_active ON TellerEnrollment(IsActive);

-- Add Teller fields to Account table
ALTER TABLE Account ADD COLUMN TellerAccountId VARCHAR(100) NULL;
ALTER TABLE Account ADD COLUMN TellerEnrollmentId INT NULL REFERENCES TellerEnrollment(Id);
CREATE INDEX idx_account_teller ON Account(TellerAccountId);

-- Add Teller field to Transaction table for deduplication
ALTER TABLE "transaction" ADD COLUMN TellerTransactionId VARCHAR(100) NULL;
CREATE UNIQUE INDEX idx_transaction_teller ON "transaction"(TellerTransactionId) WHERE TellerTransactionId IS NOT NULL;

-- Add IsActive field to Category table
ALTER TABLE Category ADD COLUMN IsActive BOOLEAN DEFAULT TRUE;
UPDATE Category SET IsActive = TRUE WHERE IsActive IS NULL;