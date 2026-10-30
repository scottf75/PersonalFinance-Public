using PersonalFinance.API.Helpers;
using PersonalFinance.API.Models;
using PetaPoco;

namespace PersonalFinance.API.Services
{
    public class TransactionService : ITransactionService
    {
        private readonly IDatabase _database;
        private readonly IUserContext _userContext;

        public TransactionService(IDatabase database, IUserContext userContext)
        {
            _database = database;
            _userContext = userContext;
        }

        public async Task<IEnumerable<Transactional>> GetAllTransactionsAsync()
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = @"
                SELECT
                    t.Id,
                    t.CategoryID,
                    t.AccountID,
                    t.Description,
                    t.Amount,
                    t.TransactionDate,
                    t.CheckNumber,
                    t.CreatedAt,
                    t.UpdatedAt,
                    t.UserId,
                    c.Name as CategoryName,
                    a.Name as AccountName
                FROM Transaction t
                LEFT JOIN Category c ON t.CategoryID = c.Id
                LEFT JOIN Account a ON t.AccountID = a.Id
                WHERE t.UserId = @0
                ORDER BY t.TransactionDate DESC";

            return await _database.FetchAsync<Transactional>(sql, userId);
        }

        public async Task<IEnumerable<Transactional>> GetTransactionsByAccountIdAsync(int accountId)
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = @"
                SELECT
                    t.Id,
                    t.CategoryID,
                    t.AccountID,
                    t.Description,
                    t.Amount,
                    t.TransactionDate,
                    t.CheckNumber,
                    t.CreatedAt,
                    t.UpdatedAt,
                    t.UserId,
                    c.Name as CategoryName,
                    a.Name as AccountName
                FROM Transaction t
                LEFT JOIN Category c ON t.CategoryID = c.Id
                LEFT JOIN Account a ON t.AccountID = a.Id
                WHERE t.AccountID = @0 AND t.UserId = @1
                ORDER BY t.TransactionDate DESC";

            return await _database.FetchAsync<Transactional>(sql, accountId, userId);
        }

        public async Task<IEnumerable<Transactional>> GetTransactionsByFiltersAsync(SearchFilters filters)
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = @"
                SELECT
                    t.Id,
                    t.CategoryID,
                    t.AccountID,
                    t.Description,
                    t.Amount,
                    t.TransactionDate,
                    t.CheckNumber,
                    t.CreatedAt,
                    t.UpdatedAt,
                    t.UserId,
                    c.Name as CategoryName,
                    a.Name as AccountName
                FROM Transaction t
                LEFT JOIN Category c ON t.CategoryID = c.Id
                LEFT JOIN Account a ON t.AccountID = a.Id
                WHERE t.UserId = @0";

            var parameters = new List<object> { userId };
            var paramIndex = 1;

            if (filters.AccountId.HasValue)
            {
                sql += $" AND t.AccountID = @{paramIndex}";
                parameters.Add(filters.AccountId.Value);
                paramIndex++;
            }

            if (!string.IsNullOrEmpty(filters.Keywords))
            {
                sql += $" AND LOWER(t.Description) LIKE @{paramIndex}";
                parameters.Add($"%{filters.Keywords.ToLower()}%");
                paramIndex++;
            }

            if (filters.CategoryIds != null && filters.CategoryIds.Length > 0)
            {
                var categoryParams = string.Join(", ", filters.CategoryIds.Select((_, i) => $"@{paramIndex + i}"));
                sql += $" AND t.CategoryID IN ({categoryParams})";
                foreach (var catId in filters.CategoryIds)
                {
                    parameters.Add(catId);
                    paramIndex++;
                }
            }

            if (filters.MinAmount.HasValue)
            {
                sql += $" AND ABS(t.Amount) >= @{paramIndex}";
                parameters.Add(filters.MinAmount.Value);
                paramIndex++;
            }

            if (filters.MaxAmount.HasValue)
            {
                sql += $" AND ABS(t.Amount) <= @{paramIndex}";
                parameters.Add(filters.MaxAmount.Value);
                paramIndex++;
            }

            if (filters.DateFrom.HasValue)
            {
                sql += $" AND t.TransactionDate >= @{paramIndex}";
                parameters.Add(filters.DateFrom.Value);
                paramIndex++;
            }

            if (filters.DateTo.HasValue)
            {
                sql += $" AND t.TransactionDate <= @{paramIndex}";
                parameters.Add(filters.DateTo.Value.AddDays(1).AddSeconds(-1)); // End of day
                paramIndex++;
            }

            sql += " ORDER BY t.TransactionDate DESC";

            return await _database.FetchAsync<Transactional>(sql, parameters.ToArray());
        }

        public async Task<Transactional> CreateTransactionAsync(Transactional transaction)
        {
            var userId = _userContext.GetCurrentUserId();

            // Set the transaction date if not provided
            if (transaction.TransactionDate == default(DateTime))
            {
                transaction.TransactionDate = DateTime.UtcNow;
            }

            var sql = @"
                INSERT INTO Transaction (CategoryID, AccountID, Description, Amount, TransactionDate, CheckNumber, CreatedAt, UpdatedAt, UserId)
                VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8)
                RETURNING Id;";

            var id = await _database.ExecuteScalarAsync<int>(sql,
                transaction.CategoryID,
                transaction.AccountID,
                transaction.Description,
                transaction.Amount,
                transaction.TransactionDate,
                transaction.CheckNumber,
                DateTime.UtcNow,
                DateTime.UtcNow,
                userId);

            transaction.ID = id;
            transaction.UserId = userId;
            return transaction;
        }

        public async Task<Transactional?> UpdateTransactionAsync(Transactional transaction)
        {
            var userId = _userContext.GetCurrentUserId();

            // Check if transaction exists and belongs to user
            var existingSql = "SELECT COUNT(*) FROM Transaction WHERE Id = @0 AND UserId = @1";
            var exists = await _database.ExecuteScalarAsync<int>(existingSql, transaction.ID, userId) > 0;

            if (!exists)
            {
                return null;
            }

            var sql = @"
                UPDATE Transaction
                SET CategoryID = @0,
                    AccountID = @1,
                    Description = @2,
                    Amount = @3,
                    TransactionDate = @4,
                    CheckNumber = @5,
                    UpdatedAt = @6
                WHERE Id = @7 AND UserId = @8";

            await _database.ExecuteAsync(sql,
                transaction.CategoryID,
                transaction.AccountID,
                transaction.Description,
                transaction.Amount,
                transaction.TransactionDate,
                transaction.CheckNumber,
                DateTime.UtcNow,
                transaction.ID,
                userId);

            // Fetch and return the updated transaction with category name
            var fetchSql = @"
                SELECT
                    t.Id,
                    t.CategoryID,
                    t.AccountID,
                    t.Description,
                    t.Amount,
                    t.TransactionDate,
                    t.CheckNumber,
                    t.CreatedAt,
                    t.UpdatedAt,
                    t.UserId,
                    c.Name as CategoryName,
                    a.Name as AccountName
                FROM Transaction t
                LEFT JOIN Category c ON t.CategoryID = c.Id
                LEFT JOIN Account a ON t.AccountID = a.Id
                WHERE t.Id = @0 AND t.UserId = @1";

            return await _database.FirstOrDefaultAsync<Transactional>(fetchSql, transaction.ID, userId);
        }

        public async Task<bool> DeleteTransactionAsync(int id)
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = "DELETE FROM Transaction WHERE Id = @0 AND UserId = @1";
            var rowsAffected = await _database.ExecuteAsync(sql, id, userId);
            return rowsAffected > 0;
        }

    }
}