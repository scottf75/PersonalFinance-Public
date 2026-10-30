using PersonalFinance.API.Models;

namespace PersonalFinance.API.Services
{
    public interface ITellerSyncService
    {
        Task<TellerEnrollment> LinkBankAsync(LinkBankRequest request);
        Task<IEnumerable<SyncResult>> SyncAllAccountsAsync(bool autoCategorize = true);
        Task<SyncResult> SyncAccountAsync(int accountId, bool autoCategorize = true);
        Task<bool> UnlinkAccountAsync(int accountId);
        Task<TellerStatusResponse> GetStatusAsync();
        Task<IEnumerable<TellerAccount>> GetTellerAccountsAsync(int enrollmentId);
        Task<bool> LinkTellerAccountToLocalAccountAsync(int localAccountId, string tellerAccountId, int enrollmentId);
    }
}
