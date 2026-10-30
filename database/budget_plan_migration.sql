-- Budget Plan Migration Script
-- Creates tables for named budgets with category allocations and account filtering

-- Named budget container
CREATE TABLE budgetplan (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    startdate TIMESTAMP NOT NULL,
    enddate TIMESTAMP NOT NULL,
    isactive BOOLEAN DEFAULT TRUE,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_budgetplan_active ON budgetplan(isactive);
CREATE INDEX idx_budgetplan_dates ON budgetplan(startdate, enddate);

-- Category allocations within a budget plan
CREATE TABLE budgetplancategory (
    id SERIAL PRIMARY KEY,
    budgetplanid INT NOT NULL REFERENCES budgetplan(id) ON DELETE CASCADE,
    categoryid INT NOT NULL REFERENCES category(id),
    budgetamount DECIMAL(15,2) NOT NULL,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_plan_category UNIQUE (budgetplanid, categoryid)
);

CREATE INDEX idx_budgetplancategory_plan ON budgetplancategory(budgetplanid);
CREATE INDEX idx_budgetplancategory_category ON budgetplancategory(categoryid);

-- Accounts included in a budget plan for reporting
CREATE TABLE budgetplanaccount (
    id SERIAL PRIMARY KEY,
    budgetplanid INT NOT NULL REFERENCES budgetplan(id) ON DELETE CASCADE,
    accountid INT NOT NULL REFERENCES account(id),
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_plan_account UNIQUE (budgetplanid, accountid)
);

CREATE INDEX idx_budgetplanaccount_plan ON budgetplanaccount(budgetplanid);
CREATE INDEX idx_budgetplanaccount_account ON budgetplanaccount(accountid);
