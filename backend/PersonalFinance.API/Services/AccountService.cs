using PersonalFinance.API.Helpers;
using PersonalFinance.API.Models;
using PetaPoco;

namespace PersonalFinance.API.Services
{
    public class AccountService : IAccountService
    {
        private readonly IDatabase _database;
        private readonly IUserContext _userContext;

        public AccountService(IDatabase database, IUserContext userContext)
        {
            _database = database;
            _userContext = userContext;
        }

        public async Task<IEnumerable<Account>> GetAllAccountsAsync()
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = @"
                SELECT a.Id, a.Name, a.Institution, a.AccountType,
                       COALESCE((SELECT SUM(t.Amount) FROM Transaction t WHERE t.AccountID = a.Id), 0) as Balance,
                       a.CreditLimit, a.DueDate,
                       a.AccountNumber, a.InvestmentType, a.Performance, a.CreatedAt, a.UpdatedAt,
                       a.LastSyncDate, a.IsActive, a.UserId
                FROM Account a
                WHERE a.IsActive = true AND a.UserId = @0
                ORDER BY a.AccountType, a.Name";

            return await _database.FetchAsync<Account>(sql, userId);
        }

        public async Task<Account?> GetAccountByIdAsync(int id)
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = @"
                SELECT a.Id, a.Name, a.Institution, a.AccountType,
                       COALESCE((SELECT SUM(t.Amount) FROM Transaction t WHERE t.AccountID = a.Id), 0) as Balance,
                       a.CreditLimit, a.DueDate,
                       a.AccountNumber, a.InvestmentType, a.Performance, a.CreatedAt, a.UpdatedAt,
                       a.LastSyncDate, a.IsActive, a.UserId
                FROM Account a
                WHERE a.Id = @0 AND a.IsActive = true AND a.UserId = @1";

            return await _database.SingleOrDefaultAsync<Account>(sql, id, userId);
        }

        public async Task<IEnumerable<Account>> GetAccountsByTypeAsync(AccountType accountType)
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = @"
                SELECT a.Id, a.Name, a.Institution, a.AccountType,
                       COALESCE((SELECT SUM(t.Amount) FROM Transaction t WHERE t.AccountID = a.Id), 0) as Balance,
                       a.CreditLimit, a.DueDate,
                       a.AccountNumber, a.InvestmentType, a.Performance, a.CreatedAt, a.UpdatedAt,
                       a.LastSyncDate, a.IsActive, a.UserId
                FROM Account a
                WHERE a.AccountType = @0 AND a.IsActive = true AND a.UserId = @1
                ORDER BY a.Name";

            return await _database.FetchAsync<Account>(sql, (int)accountType, userId);
        }

        public async Task<Account> CreateAccountAsync(Account account)
        {
            var userId = _userContext.GetCurrentUserId();
            account.CreatedAt = DateTime.UtcNow;
            account.UpdatedAt = DateTime.UtcNow;
            account.IsActive = true;
            account.UserId = userId;

            var sql = @"
                INSERT INTO Account (Name, Institution, AccountType, Balance, CreditLimit, DueDate,
                                   AccountNumber, InvestmentType, Performance, CreatedAt, UpdatedAt,
                                   LastSyncDate, IsActive, UserId)
                VALUES (@Name, @Institution, @AccountType, @Balance, @CreditLimit, @DueDate,
                        @AccountNumber, @InvestmentType, @Performance, @CreatedAt, @UpdatedAt,
                        @LastSyncDate, @IsActive, @UserId)
                RETURNING Id;";
            var id = await _database.ExecuteScalarAsync<int>(sql, account);
            account.Id = id;

            return account;
        }

        public async Task<Account?> UpdateAccountAsync(int id, Account account)
        {
            var existingAccount = await GetAccountByIdAsync(id);
            if (existingAccount == null)
                return null;

            // Merge incoming data with existing account - preserve fields not provided
            existingAccount.Name = !string.IsNullOrEmpty(account.Name) ? account.Name : existingAccount.Name;
            existingAccount.Institution = !string.IsNullOrEmpty(account.Institution) ? account.Institution : existingAccount.Institution;
            existingAccount.AccountType = account.AccountType != 0 ? account.AccountType : existingAccount.AccountType;
            existingAccount.CreditLimit = account.CreditLimit ?? existingAccount.CreditLimit;
            existingAccount.DueDate = account.DueDate ?? existingAccount.DueDate;
            existingAccount.AccountNumber = account.AccountNumber ?? existingAccount.AccountNumber;
            existingAccount.InvestmentType = account.InvestmentType ?? existingAccount.InvestmentType;
            existingAccount.Performance = account.Performance ?? existingAccount.Performance;
            existingAccount.LastSyncDate = account.LastSyncDate ?? existingAccount.LastSyncDate;
            existingAccount.UpdatedAt = DateTime.UtcNow;

            var userId = _userContext.GetCurrentUserId();
            var sql = @"
                UPDATE Account
                SET Name = @Name, Institution = @Institution, AccountType = @AccountType,
                    CreditLimit = @CreditLimit, DueDate = @DueDate,
                    AccountNumber = @AccountNumber, InvestmentType = @InvestmentType,
                    Performance = @Performance, UpdatedAt = @UpdatedAt, LastSyncDate = @LastSyncDate
                WHERE Id = @Id AND IsActive = true AND UserId = @UserId";

            var rowsAffected = await _database.ExecuteAsync(sql, existingAccount);

            return rowsAffected > 0 ? existingAccount : null;
        }

        public async Task<bool> DeleteAccountAsync(int id)
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = @"
                UPDATE Account
                SET IsActive = false, UpdatedAt = @UpdatedAt
                WHERE Id = @Id AND IsActive = true AND UserId = @UserId";

            var rowsAffected = await _database.ExecuteAsync(sql, new { Id = id, UpdatedAt = DateTime.UtcNow, UserId = userId });

            return rowsAffected > 0;
        }

        public async Task<decimal> GetTotalBalanceByTypeAsync(AccountType accountType)
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = @"
                SELECT COALESCE(SUM(t.Amount), 0)
                FROM Transaction t
                INNER JOIN Account a ON t.AccountID = a.Id
                WHERE a.AccountType = @0 AND a.IsActive = true AND a.UserId = @1";

            return await _database.ExecuteScalarAsync<decimal>(sql, (int)accountType, userId);
        }

        public async Task<decimal> GetNetWorthAsync()
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = @"
                SELECT COALESCE(SUM(
                    CASE
                        WHEN a.AccountType = @CreditType THEN -t.Amount
                        ELSE t.Amount
                    END
                ), 0)
                FROM Transaction t
                INNER JOIN Account a ON t.AccountID = a.Id
                WHERE a.IsActive = true AND a.UserId = @UserId";

            return await _database.ExecuteScalarAsync<decimal>(sql, new { CreditType = (int)AccountType.Credit, UserId = userId });
        }
    }
}
