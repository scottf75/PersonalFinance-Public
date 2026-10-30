using PersonalFinance.API.Models;

namespace PersonalFinance.API.Services
{
    public interface ITellerClient
    {
        Task<IEnumerable<TellerAccount>> GetAccountsAsync(string accessToken);
        Task<TellerBalance?> GetAccountBalanceAsync(string accessToken, string accountId);
        Task<IEnumerable<TellerTransaction>> GetTransactionsAsync(string accessToken, string accountId, DateTime? fromDate = null);
    }
}
