using PersonalFinance.API.Helpers;
using PersonalFinance.API.Models;
using PetaPoco;

namespace PersonalFinance.API.Services
{
    public class BudgetPlanService : IBudgetPlanService
    {
        private readonly IDatabase _database;
        private readonly IUserContext _userContext;

        public BudgetPlanService(IDatabase database, IUserContext userContext)
        {
            _database = database ?? throw new ArgumentNullException(nameof(database));
            _userContext = userContext ?? throw new ArgumentNullException(nameof(userContext));
        }

        #region Budget Plan CRUD

        public async Task<IEnumerable<BudgetPlan>> GetAllBudgetPlansAsync()
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = @"
                SELECT
                    bp.id, bp.name, bp.description, bp.startdate, bp.enddate,
                    bp.isactive, bp.createdat, bp.updatedat, bp.userid,
                    COALESCE(cat_count.cnt, 0) as CategoryCount,
                    COALESCE(acc_count.cnt, 0) as AccountCount,
                    COALESCE(budget_total.total, 0) as TotalBudgeted
                FROM budgetplan bp
                LEFT JOIN (
                    SELECT budgetplanid, COUNT(*) as cnt
                    FROM budgetplancategory
                    GROUP BY budgetplanid
                ) cat_count ON bp.id = cat_count.budgetplanid
                LEFT JOIN (
                    SELECT budgetplanid, COUNT(*) as cnt
                    FROM budgetplanaccount
                    GROUP BY budgetplanid
                ) acc_count ON bp.id = acc_count.budgetplanid
                LEFT JOIN (
                    SELECT budgetplanid, SUM(budgetamount) as total
                    FROM budgetplancategory
                    GROUP BY budgetplanid
                ) budget_total ON bp.id = budget_total.budgetplanid
                WHERE bp.isactive = true AND bp.userid = @0
                ORDER BY bp.startdate DESC, bp.name";

            return await Task.FromResult(_database.Query<BudgetPlan>(sql, userId).ToList());
        }

        public async Task<BudgetPlan?> GetBudgetPlanByIdAsync(int id)
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = @"
                SELECT id, name, description, startdate, enddate, isactive, createdat, updatedat, userid
                FROM budgetplan
                WHERE id = @0 AND userid = @1";

            var plan = _database.FirstOrDefault<BudgetPlan>(sql, id, userId);

            if (plan != null)
            {
                // Load categories
                plan.Categories = (await GetBudgetPlanCategoriesAsync(id)).ToList();
                // Load accounts
                plan.Accounts = (await GetBudgetPlanAccountsAsync(id)).ToList();
            }

            return await Task.FromResult(plan);
        }

        public async Task<BudgetPlan> CreateBudgetPlanAsync(BudgetPlan plan)
        {
            var userId = _userContext.GetCurrentUserId();

            if (plan == null)
                throw new ArgumentNullException(nameof(plan));

            plan.CreatedAt = DateTime.UtcNow;
            plan.UpdatedAt = DateTime.UtcNow;
            plan.IsActive = true;
            plan.UserId = userId;

            var id = _database.Insert("budgetplan", "id", true, plan);
            plan.Id = Convert.ToInt32(id);

            return await Task.FromResult(plan);
        }

        public async Task<BudgetPlan> UpdateBudgetPlanAsync(int id, BudgetPlan plan)
        {
            var userId = _userContext.GetCurrentUserId();
            var existing = _database.FirstOrDefault<BudgetPlan>(
                "SELECT id, name, description, startdate, enddate, isactive, createdat, updatedat, userid FROM budgetplan WHERE id = @0 AND userid = @1", id, userId);

            if (existing == null)
                throw new InvalidOperationException($"Budget plan with ID {id} not found");

            existing.Name = plan.Name;
            existing.Description = plan.Description;
            existing.StartDate = plan.StartDate;
            existing.EndDate = plan.EndDate;
            existing.UpdatedAt = DateTime.UtcNow;

            _database.Update("budgetplan", "id", existing, existing.Id);

            return await Task.FromResult(existing);
        }

        public async Task<bool> DeleteBudgetPlanAsync(int id)
        {
            var userId = _userContext.GetCurrentUserId();
            // Soft delete
            var sql = "UPDATE budgetplan SET isactive = false, updatedat = @0 WHERE id = @1 AND userid = @2";
            var rowsAffected = _database.Execute(sql, DateTime.UtcNow, id, userId);
            return await Task.FromResult(rowsAffected > 0);
        }

        #endregion

        #region Category Management

        public async Task<IEnumerable<BudgetPlanCategory>> GetBudgetPlanCategoriesAsync(int budgetPlanId)
        {
            var sql = @"
                SELECT
                    bpc.id, bpc.budgetplanid, bpc.categoryid, bpc.budgetamount,
                    bpc.createdat, bpc.updatedat,
                    c.name as CategoryName, c.icon as CategoryIcon, c.categorytype as CategoryType
                FROM budgetplancategory bpc
                JOIN category c ON bpc.categoryid = c.id
                WHERE bpc.budgetplanid = @0
                ORDER BY c.categorytype, c.name";

            return await Task.FromResult(_database.Query<BudgetPlanCategory>(sql, budgetPlanId).ToList());
        }

        public async Task<BudgetPlanCategory> AddCategoryToPlanAsync(int budgetPlanId, int categoryId, decimal amount)
        {
            // Check if already exists
            var existing = _database.FirstOrDefault<BudgetPlanCategory>(
                "SELECT id, budgetplanid, categoryid, budgetamount FROM budgetplancategory WHERE budgetplanid = @0 AND categoryid = @1",
                budgetPlanId, categoryId);

            if (existing != null)
            {
                // Update existing
                existing.BudgetAmount = amount;
                existing.UpdatedAt = DateTime.UtcNow;
                _database.Update("budgetplancategory", "id", existing, existing.Id);
                return await Task.FromResult(existing);
            }

            var category = new BudgetPlanCategory
            {
                BudgetPlanId = budgetPlanId,
                CategoryId = categoryId,
                BudgetAmount = amount,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var id = _database.Insert("budgetplancategory", "id", true, category);
            category.Id = Convert.ToInt32(id);

            // Fetch category name
            var catInfo = _database.FirstOrDefault<Category>("SELECT id, name, icon FROM category WHERE id = @0", categoryId);
            if (catInfo != null)
            {
                category.CategoryName = catInfo.Name;
                category.CategoryIcon = catInfo.Icon;
            }

            return await Task.FromResult(category);
        }

        public async Task<BudgetPlanCategory> UpdatePlanCategoryAsync(int budgetPlanId, int categoryId, decimal amount)
        {
            var existing = _database.FirstOrDefault<BudgetPlanCategory>(
                "SELECT id, budgetplanid, categoryid, budgetamount FROM budgetplancategory WHERE budgetplanid = @0 AND categoryid = @1",
                budgetPlanId, categoryId);

            if (existing == null)
                throw new InvalidOperationException($"Category {categoryId} not found in budget plan {budgetPlanId}");

            existing.BudgetAmount = amount;
            existing.UpdatedAt = DateTime.UtcNow;

            _database.Update("budgetplancategory", "id", existing, existing.Id);

            return await Task.FromResult(existing);
        }

        public async Task<bool> RemoveCategoryFromPlanAsync(int budgetPlanId, int categoryId)
        {
            var sql = "DELETE FROM budgetplancategory WHERE budgetplanid = @0 AND categoryid = @1";
            var rowsAffected = _database.Execute(sql, budgetPlanId, categoryId);
            return await Task.FromResult(rowsAffected > 0);
        }

        public async Task BatchUpdateCategoriesAsync(int budgetPlanId, IEnumerable<BudgetPlanCategory> categories)
        {
            // Delete existing categories
            _database.Execute("DELETE FROM budgetplancategory WHERE budgetplanid = @0", budgetPlanId);

            // Insert new categories
            foreach (var category in categories)
            {
                category.Id = 0; // Reset ID to ensure auto-increment generates new ID
                category.BudgetPlanId = budgetPlanId;
                category.CreatedAt = DateTime.UtcNow;
                category.UpdatedAt = DateTime.UtcNow;
                _database.Insert("budgetplancategory", "id", true, category);
            }

            await Task.CompletedTask;
        }

        #endregion

        #region Account Management

        public async Task<IEnumerable<BudgetPlanAccount>> GetBudgetPlanAccountsAsync(int budgetPlanId)
        {
            var sql = @"
                SELECT
                    bpa.id, bpa.budgetplanid, bpa.accountid, bpa.createdat,
                    a.name as AccountName, a.institution as Institution, a.accounttype as AccountType
                FROM budgetplanaccount bpa
                JOIN account a ON bpa.accountid = a.id
                WHERE bpa.budgetplanid = @0
                ORDER BY a.name";

            return await Task.FromResult(_database.Query<BudgetPlanAccount>(sql, budgetPlanId).ToList());
        }

        public async Task SetPlanAccountsAsync(int budgetPlanId, IEnumerable<int> accountIds)
        {
            // Delete existing accounts
            _database.Execute("DELETE FROM budgetplanaccount WHERE budgetplanid = @0", budgetPlanId);

            // Insert new accounts
            foreach (var accountId in accountIds)
            {
                var planAccount = new BudgetPlanAccount
                {
                    BudgetPlanId = budgetPlanId,
                    AccountId = accountId,
                    CreatedAt = DateTime.UtcNow
                };
                _database.Insert("budgetplanaccount", "id", true, planAccount);
            }

            await Task.CompletedTask;
        }

        #endregion

        #region Reporting

        public async Task<BudgetPlanReport> GetBudgetPlanReportAsync(int budgetPlanId, DateTime? startDate = null, DateTime? endDate = null)
        {
            var userId = _userContext.GetCurrentUserId();
            var plan = _database.FirstOrDefault<BudgetPlan>(
                "SELECT id, name, description, startdate, enddate FROM budgetplan WHERE id = @0 AND userid = @1", budgetPlanId, userId);

            if (plan == null)
                throw new InvalidOperationException($"Budget plan with ID {budgetPlanId} not found");

            // Use custom date range or plan's date range
            var reportStartDate = startDate ?? plan.StartDate;
            var reportEndDate = endDate ?? plan.EndDate.AddDays(1); // Add 1 day to include end date

            var report = new BudgetPlanReport
            {
                BudgetPlanId = plan.Id,
                BudgetPlanName = plan.Name,
                StartDate = reportStartDate,
                EndDate = endDate ?? plan.EndDate
            };

            // Get included account IDs for this user
            var accountIds = _database.Query<int>(
                "SELECT accountid FROM budgetplanaccount WHERE budgetplanid = @0", budgetPlanId).ToList();

            // If no accounts specified, include all active accounts for this user
            if (!accountIds.Any())
            {
                accountIds = _database.Query<int>("SELECT id FROM account WHERE isactive = true AND userid = @0", userId).ToList();
            }

            var accountIdList = string.Join(",", accountIds);

            // Get category reports with spending from included accounts only
            var categorySql = $@"
                SELECT
                    bpc.categoryid as CategoryId,
                    c.name as CategoryName,
                    c.icon as CategoryIcon,
                    c.categorytype as CategoryType,
                    bpc.budgetamount as BudgetAmount,
                    COALESCE(ABS(SUM(CASE WHEN t.amount < 0 THEN t.amount ELSE 0 END)), 0) as SpentAmount,
                    COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) as IncomeAmount
                FROM budgetplancategory bpc
                JOIN category c ON bpc.categoryid = c.id
                LEFT JOIN ""transaction"" t ON c.id = t.categoryid
                    AND t.transactiondate >= @0 AND t.transactiondate < @1
                    AND t.accountid IN ({accountIdList})
                WHERE bpc.budgetplanid = @2
                GROUP BY bpc.categoryid, c.name, c.icon, c.categorytype, bpc.budgetamount
                ORDER BY c.categorytype, c.name";

            var categoryReports = _database.Fetch<BudgetPlanCategoryReport>(categorySql, reportStartDate, reportEndDate, budgetPlanId);

            // Calculate remaining and percentage for each category
            foreach (var cat in categoryReports)
            {
                cat.RemainingAmount = cat.BudgetAmount - cat.SpentAmount;
                cat.PercentageUsed = cat.BudgetAmount > 0
                    ? Math.Round((cat.SpentAmount / cat.BudgetAmount) * 100, 2)
                    : 0;
            }

            report.CategoryReports = categoryReports;
            report.TotalBudgeted = categoryReports.Sum(c => c.BudgetAmount);
            report.TotalSpent = categoryReports.Sum(c => c.SpentAmount);
            report.TotalIncome = categoryReports.Sum(c => c.IncomeAmount);
            report.NetDifference = report.TotalBudgeted - report.TotalSpent;

            // Get account summaries
            var accountSql = $@"
                SELECT
                    a.id as AccountId,
                    a.name as AccountName,
                    a.institution as Institution,
                    a.accounttype as AccountType,
                    COALESCE(ABS(SUM(CASE WHEN t.amount < 0 THEN t.amount ELSE 0 END)), 0) as TotalSpent,
                    COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) as TotalIncome
                FROM account a
                LEFT JOIN ""transaction"" t ON a.id = t.accountid
                    AND t.transactiondate >= @0 AND t.transactiondate < @1
                WHERE a.id IN ({accountIdList})
                GROUP BY a.id, a.name, a.institution, a.accounttype
                ORDER BY a.name";

            report.AccountSummaries = _database.Fetch<BudgetPlanAccountSummary>(accountSql, reportStartDate, reportEndDate);

            return await Task.FromResult(report);
        }

        public async Task<IEnumerable<Transactional>> GetCategoryTransactionsAsync(int budgetPlanId, int categoryId, DateTime? startDate = null, DateTime? endDate = null)
        {
            var userId = _userContext.GetCurrentUserId();
            var plan = _database.FirstOrDefault<BudgetPlan>(
                "SELECT id, name, description, startdate, enddate FROM budgetplan WHERE id = @0 AND userid = @1", budgetPlanId, userId);

            if (plan == null)
                throw new InvalidOperationException($"Budget plan with ID {budgetPlanId} not found");

            // Use custom date range or plan's date range
            var reportStartDate = startDate ?? plan.StartDate;
            var reportEndDate = endDate ?? plan.EndDate.AddDays(1);

            // Get included account IDs
            var accountIds = _database.Query<int>(
                "SELECT accountid FROM budgetplanaccount WHERE budgetplanid = @0", budgetPlanId).ToList();

            // If no accounts specified, include all active accounts for this user
            if (!accountIds.Any())
            {
                accountIds = _database.Query<int>("SELECT id FROM account WHERE isactive = true AND userid = @0", userId).ToList();
            }

            var accountIdList = string.Join(",", accountIds);

            var sql = $@"
                SELECT
                    t.id, t.description, t.amount, t.categoryid, t.accountid,
                    t.transactiondate, t.checknumber,
                    c.name as CategoryName,
                    a.name as AccountName
                FROM ""transaction"" t
                JOIN category c ON t.categoryid = c.id
                JOIN account a ON t.accountid = a.id
                WHERE t.categoryid = @0
                    AND t.transactiondate >= @1 AND t.transactiondate < @2
                    AND t.accountid IN ({accountIdList})
                ORDER BY t.transactiondate DESC";

            return await Task.FromResult(_database.Query<Transactional>(sql, categoryId, reportStartDate, reportEndDate).ToList());
        }

        #endregion
    }
}
