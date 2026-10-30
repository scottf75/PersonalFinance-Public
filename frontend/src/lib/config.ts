export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'https://localhost:7236',
} as const;

export const api = {
  accounts: `${config.apiUrl}/api/account`,
  transactions: `${config.apiUrl}/api/transaction`,
  categories: `${config.apiUrl}/api/category`,
  budgets: `${config.apiUrl}/api/budget`,
  budgetPlans: `${config.apiUrl}/api/budgetplan`,
  settings: `${config.apiUrl}/api/settings`,
  categorization: `${config.apiUrl}/api/categorization`,
  search: `${config.apiUrl}/api/search`,
  teller: `${config.apiUrl}/api/teller`,
  dashboard: `${config.apiUrl}/api/dashboard`,
  reports: `${config.apiUrl}/api/reports`,
} as const;

// Teller.io configuration - set your Application ID here or via environment variable
export const tellerConfig = {
  applicationId: import.meta.env.VITE_TELLER_APP_ID || '',
  environment: import.meta.env.VITE_TELLER_ENV || 'sandbox',
} as const;

// OAuth configuration
export const oauthConfig = {
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
} as const;