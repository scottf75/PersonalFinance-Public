-- Personal Finance Application - Seed Data
-- Run this script to populate the database with common categories

-- Clear existing categories (optional - comment out if you want to preserve existing data)
-- TRUNCATE TABLE Category RESTART IDENTITY CASCADE;

-- Insert common personal finance categories
INSERT INTO Category (Name, Description, Icon) VALUES
-- Income Categories
('Salary', 'Regular employment income and wages', '💰'),
('Freelance', 'Freelance, contract, or side gig income', '💼'),
('Investment Income', 'Dividends, capital gains, and investment returns', '📈'),
('Interest', 'Bank interest and savings account earnings', '🏦'),
('Gifts Received', 'Money received as gifts', '🎁'),
('Refunds', 'Refunds and reimbursements', '↩️'),
('Other Income', 'Miscellaneous income sources', '💵'),

-- Housing
('Rent', 'Monthly rent payments', '🏠'),
('Mortgage', 'Mortgage payments including principal and interest', '🏡'),
('Property Tax', 'Real estate and property taxes', '📋'),
('Home Insurance', 'Homeowners or renters insurance', '🛡️'),
('Home Maintenance', 'Repairs, maintenance, and home improvements', '🔧'),
('HOA Fees', 'Homeowners association fees', '🏘️'),

-- Utilities
('Electricity', 'Electric utility bills', '⚡'),
('Gas', 'Natural gas and heating bills', '🔥'),
('Water', 'Water and sewer utility bills', '💧'),
('Internet', 'Internet service provider bills', '🌐'),
('Phone', 'Mobile phone and landline bills', '📱'),
('Streaming Services', 'Netflix, Spotify, and other streaming subscriptions', '📺'),

-- Transportation
('Car Payment', 'Auto loan or lease payments', '🚗'),
('Fuel', 'Gasoline and vehicle fuel', '⛽'),
('Auto Insurance', 'Vehicle insurance premiums', '🚙'),
('Car Maintenance', 'Oil changes, repairs, and vehicle maintenance', '🔩'),
('Parking', 'Parking fees and permits', '🅿️'),
('Public Transit', 'Bus, subway, train, and public transportation', '🚌'),
('Rideshare', 'Uber, Lyft, and taxi services', '🚕'),

-- Food & Dining
('Groceries', 'Food and household supplies from grocery stores', '🛒'),
('Restaurants', 'Dining out and sit-down restaurants', '🍽️'),
('Fast Food', 'Quick service restaurants and takeout', '🍔'),
('Coffee', 'Coffee shops and cafes', '☕'),
('Alcohol', 'Beer, wine, and spirits', '🍷'),

-- Shopping
('Clothing', 'Apparel, shoes, and accessories', '👕'),
('Electronics', 'Computers, phones, gadgets, and tech', '💻'),
('Home Goods', 'Furniture, decor, and household items', '🛋️'),
('Personal Care', 'Toiletries, cosmetics, and hygiene products', '🧴'),
('Amazon', 'Amazon purchases', '📦'),

-- Healthcare
('Health Insurance', 'Medical and health insurance premiums', '🏥'),
('Doctor', 'Doctor visits and medical appointments', '👨‍⚕️'),
('Pharmacy', 'Prescription medications and pharmacy purchases', '💊'),
('Dental', 'Dental care and orthodontics', '🦷'),
('Vision', 'Eye care, glasses, and contacts', '👓'),
('Mental Health', 'Therapy and mental health services', '🧠'),

-- Entertainment & Recreation
('Entertainment', 'Movies, concerts, events, and shows', '🎬'),
('Hobbies', 'Hobby supplies and activities', '🎨'),
('Sports', 'Sports equipment and recreation', '⚽'),
('Games', 'Video games, board games, and gaming', '🎮'),
('Books', 'Books, magazines, and reading materials', '📚'),

-- Personal & Lifestyle
('Haircare', 'Haircuts, styling, and salon services', '💇'),
('Gym', 'Gym memberships and fitness classes', '🏋️'),
('Education', 'Tuition, courses, and educational expenses', '🎓'),
('Subscriptions', 'Magazine, software, and service subscriptions', '📰'),

-- Financial
('Bank Fees', 'ATM fees, account fees, and bank charges', '🏧'),
('Credit Card Interest', 'Interest charges on credit cards', '💳'),
('Loan Payment', 'Personal loan and debt payments', '📄'),
('Savings', 'Transfers to savings accounts', '🐷'),
('Investments', 'Stock purchases and investment contributions', '📊'),

-- Family & Life
('Childcare', 'Daycare, babysitting, and child-related expenses', '👶'),
('Pet', 'Pet food, vet bills, and pet supplies', '🐕'),
('Gifts Given', 'Gifts purchased for others', '🎀'),
('Donations', 'Charitable contributions and donations', '❤️'),

-- Travel
('Travel', 'Flights, hotels, and vacation expenses', '✈️'),
('Lodging', 'Hotels, Airbnb, and accommodation', '🏨'),

-- Other
('Business Expense', 'Work-related and business expenses', '💼'),
('Taxes', 'Income tax, estimated taxes, and tax payments', '📑'),
('Insurance', 'Life, disability, and other insurance', '📋'),
('Legal', 'Legal fees and services', '⚖️'),
('Miscellaneous', 'Other uncategorized expenses', '📌'),
('Uncategorized', 'Transactions pending categorization', '❓')

ON CONFLICT DO NOTHING;

-- Verify the insert
SELECT COUNT(*) as total_categories FROM Category;
