using PersonalFinance.API.Models;

namespace PersonalFinance.API.Services
{
    public interface IAccountService
    {
        Task<IEnumerable<Account>> GetAllAccountsAsync();
        Task<Account?> GetAccountByIdAsync(int id);
        Task<IEnumerable<Account>> GetAccountsByTypeAsync(AccountType accountType);
        Task<Account> CreateAccountAsync(Account account);
        Task<Account?> UpdateAccountAsync(int id, Account account);
        Task<bool> DeleteAccountAsync(int id);
        Task<decimal> GetTotalBalanceByTypeAsync(AccountType accountType);
        Task<decimal> GetNetWorthAsync();
    }
}