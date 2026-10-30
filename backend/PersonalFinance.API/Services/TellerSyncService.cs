using System.Globalization;
using PersonalFinance.API.Helpers;
using PersonalFinance.API.Models;
using PetaPoco;

namespace PersonalFinance.API.Services
{
    public class TellerSyncService : ITellerSyncService
    {
        private readonly IDatabase _database;
        private readonly ITellerClient _tellerClient;
        private readonly ICategorizationService _categorizationService;
        private readonly ICategoryService _categoryService;
        private readonly IUserContext _userContext;
        private readonly ILogger<TellerSyncService> _logger;

        public TellerSyncService(
            IDatabase database,
            ITellerClient tellerClient,
            ICategorizationService categorizationService,
            ICategoryService categoryService,
            IUserContext userContext,
            ILogger<TellerSyncService> logger)
        {
            _database = database;
            _tellerClient = tellerClient;
            _categorizationService = categorizationService;
            _categoryService = categoryService;
            _userContext = userContext;
            _logger = logger;
        }

        public async Task<TellerEnrollment> LinkBankAsync(LinkBankRequest request)
        {
            var userId = _userContext.GetCurrentUserId();
            var enrollment = new TellerEnrollment
            {
                EnrollmentId = request.EnrollmentId,
                AccessToken = request.AccessToken,
                InstitutionName = request.InstitutionName,
                CreatedAt = DateTime.UtcNow,
                IsActive = true,
                UserId = userId
            };

            await _database.InsertAsync(enrollment);
            _logger.LogInformation("Created Teller enrollment {EnrollmentId} for {Institution}",
                enrollment.EnrollmentId, enrollment.InstitutionName);

            return enrollment;
        }

        public async Task<IEnumerable<TellerAccount>> GetTellerAccountsAsync(int enrollmentId)
        {
            var userId = _userContext.GetCurrentUserId();
            var enrollment = await _database.SingleOrDefaultAsync<TellerEnrollment>(
                "SELECT * FROM tellerenrollment WHERE id = @0 AND isactive = true AND userid = @1", enrollmentId, userId);

            if (enrollment == null)
            {
                _logger.LogWarning("Enrollment {EnrollmentId} not found or inactive", enrollmentId);
                return Enumerable.Empty<TellerAccount>();
            }

            return await _tellerClient.GetAccountsAsync(enrollment.AccessToken);
        }

        public async Task<bool> LinkTellerAccountToLocalAccountAsync(int localAccountId, string tellerAccountId, int enrollmentId)
        {
            var userId = _userContext.GetCurrentUserId();
            var account = await _database.SingleOrDefaultAsync<Account>(
                "SELECT * FROM account WHERE id = @0 AND userid = @1", localAccountId, userId);

            if (account == null)
            {
                _logger.LogWarning("Local account {AccountId} not found", localAccountId);
                return false;
            }

            account.TellerAccountId = tellerAccountId;
            account.TellerEnrollmentId = enrollmentId;
            account.UpdatedAt = DateTime.UtcNow;

            await _database.UpdateAsync(account);
            _logger.LogInformation("Linked local account {LocalAccountId} to Teller account {TellerAccountId}",
                localAccountId, tellerAccountId);

            return true;
        }

        public async Task<IEnumerable<SyncResult>> SyncAllAccountsAsync(bool autoCategorize = true)
        {
            var userId = _userContext.GetCurrentUserId();
            var results = new List<SyncResult>();

            var linkedAccounts = await _database.FetchAsync<Account>(
                "SELECT * FROM account WHERE telleraccountid IS NOT NULL AND tellerenrollmentid IS NOT NULL AND isactive = true AND userid = @0", userId);

            foreach (var account in linkedAccounts)
            {
                var result = await SyncAccountAsync(account.Id, autoCategorize);
                results.Add(result);
            }

            return results;
        }

        public async Task<SyncResult> SyncAccountAsync(int accountId, bool autoCategorize = true)
        {
            var userId = _userContext.GetCurrentUserId();
            var result = new SyncResult { AccountId = accountId };

            try
            {
                // Get account with Teller credentials for this user
                var account = await _database.SingleOrDefaultAsync<Account>(
                    "SELECT * FROM account WHERE id = @0 AND userid = @1", accountId, userId);

                if (account == null)
                {
                    result.Success = false;
                    result.ErrorMessage = "Account not found";
                    return result;
                }

                result.AccountName = account.Name;

                if (string.IsNullOrEmpty(account.TellerAccountId) || !account.TellerEnrollmentId.HasValue)
                {
                    result.Success = false;
                    result.ErrorMessage = "Account is not linked to Teller";
                    return result;
                }

                var enrollment = await _database.SingleOrDefaultAsync<TellerEnrollment>(
                    "SELECT * FROM tellerenrollment WHERE id = @0 AND isactive = true AND userid = @1",
                    account.TellerEnrollmentId.Value, userId);

                if (enrollment == null)
                {
                    result.Success = false;
                    result.ErrorMessage = "Teller enrollment not found or inactive";
                    return result;
                }

                // Determine sync start date (last sync or 90 days ago for initial)
                var fromDate = account.LastSyncDate ?? DateTime.UtcNow.AddDays(-90);

                // Fetch transactions from Teller
                var tellerTransactions = await _tellerClient.GetTransactionsAsync(
                    enrollment.AccessToken,
                    account.TellerAccountId,
                    fromDate);

                // Get existing Teller transaction IDs for deduplication
                var existingTellerIds = new HashSet<string>(
                    await _database.FetchAsync<string>(
                        "SELECT tellertransactionid FROM transaction WHERE tellertransactionid IS NOT NULL AND accountid = @0",
                        accountId));

                // Get default category for uncategorized transactions
                var categories = _categoryService.GetAllCategories();
                var defaultCategoryId = categories.FirstOrDefault(c =>
                    c.Name.Equals("Uncategorized", StringComparison.OrdinalIgnoreCase))?.ID ?? 1;

                int imported = 0;
                int skipped = 0;

                foreach (var tellerTxn in tellerTransactions)
                {
                    // Skip if already imported
                    if (existingTellerIds.Contains(tellerTxn.Id))
                    {
                        skipped++;
                        continue;
                    }

                    // Parse amount (Teller returns as string)
                    if (!decimal.TryParse(tellerTxn.Amount, NumberStyles.Any, CultureInfo.InvariantCulture, out var amount))
                    {
                        _logger.LogWarning("Could not parse amount '{Amount}' for transaction {TxnId}",
                            tellerTxn.Amount, tellerTxn.Id);
                        skipped++;
                        continue;
                    }

                    // Parse date
                    if (!DateTime.TryParse(tellerTxn.Date, out var txnDate))
                    {
                        txnDate = DateTime.UtcNow;
                    }

                    // Auto-categorize the transaction if enabled
                    var categoryId = defaultCategoryId;
                    if (autoCategorize)
                    {
                        try
                        {
                            var suggestion = await _categorizationService.SuggestCategoryAsync(tellerTxn.Description);
                            if (suggestion.SuggestedCategoryId.HasValue && suggestion.Confidence >= 0.7)
                            {
                                categoryId = suggestion.SuggestedCategoryId.Value;
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Auto-categorization failed for transaction {TxnId}", tellerTxn.Id);
                        }
                    }

                    // Create the transaction
                    var transaction = new Transactional
                    {
                        AccountID = accountId,
                        CategoryID = categoryId,
                        Description = tellerTxn.Description,
                        Amount = amount,
                        TransactionDate = txnDate,
                        TellerTransactionId = tellerTxn.Id,
                        UserId = userId
                    };

                    await _database.InsertAsync(transaction);
                    imported++;
                }

                // Update account balance from Teller
                var balance = await _tellerClient.GetAccountBalanceAsync(
                    enrollment.AccessToken,
                    account.TellerAccountId);

                if (balance != null && decimal.TryParse(balance.Ledger ?? balance.Available,
                    NumberStyles.Any, CultureInfo.InvariantCulture, out var newBalance))
                {
                    account.Balance = newBalance;
                    result.NewBalance = newBalance;
                }

                // Update last sync date
                account.LastSyncDate = DateTime.UtcNow;
                account.UpdatedAt = DateTime.UtcNow;
                await _database.UpdateAsync(account);

                // Update enrollment last sync
                enrollment.LastSyncAt = DateTime.UtcNow;
                await _database.UpdateAsync(enrollment);

                result.TransactionsImported = imported;
                result.TransactionsSkipped = skipped;
                result.Success = true;

                _logger.LogInformation("Synced account {AccountId}: {Imported} imported, {Skipped} skipped",
                    accountId, imported, skipped);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing account {AccountId}", accountId);
                result.Success = false;
                result.ErrorMessage = ex.Message;
            }

            return result;
        }

        public async Task<bool> UnlinkAccountAsync(int accountId)
        {
            var userId = _userContext.GetCurrentUserId();
            var account = await _database.SingleOrDefaultAsync<Account>(
                "SELECT * FROM account WHERE id = @0 AND userid = @1", accountId, userId);

            if (account == null)
            {
                return false;
            }

            account.TellerAccountId = null;
            account.TellerEnrollmentId = null;
            account.UpdatedAt = DateTime.UtcNow;

            await _database.UpdateAsync(account);
            _logger.LogInformation("Unlinked account {AccountId} from Teller", accountId);

            return true;
        }

        public async Task<TellerStatusResponse> GetStatusAsync()
        {
            var userId = _userContext.GetCurrentUserId();
            var response = new TellerStatusResponse();

            var enrollments = await _database.FetchAsync<TellerEnrollment>(
                "SELECT * FROM tellerenrollment WHERE isactive = true AND userid = @0", userId);

            foreach (var enrollment in enrollments)
            {
                var status = new EnrollmentStatus
                {
                    Id = enrollment.Id,
                    EnrollmentId = enrollment.EnrollmentId,
                    InstitutionName = enrollment.InstitutionName,
                    LastSyncAt = enrollment.LastSyncAt,
                    IsActive = enrollment.IsActive
                };

                var linkedAccounts = await _database.FetchAsync<Account>(
                    "SELECT * FROM account WHERE tellerenrollmentid = @0 AND isactive = true AND userid = @1",
                    enrollment.Id, userId);

                foreach (var account in linkedAccounts)
                {
                    status.Accounts.Add(new LinkedAccountStatus
                    {
                        AccountId = account.Id,
                        AccountName = account.Name,
                        TellerAccountId = account.TellerAccountId,
                        LastSyncDate = account.LastSyncDate
                    });
                }

                response.Enrollments.Add(status);
            }

            return response;
        }
    }
}
