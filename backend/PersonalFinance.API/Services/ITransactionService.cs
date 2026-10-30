using PersonalFinance.API.Models;

namespace PersonalFinance.API.Services
{
    public interface ITransactionService
    {
        Task<IEnumerable<Transactional>> GetAllTransactionsAsync();
        Task<IEnumerable<Transactional>> GetTransactionsByAccountIdAsync(int accountId);
        Task<IEnumerable<Transactional>> GetTransactionsByFiltersAsync(SearchFilters filters);
        Task<Transactional> CreateTransactionAsync(Transactional transaction);
        Task<Transactional?> UpdateTransactionAsync(Transactional transaction);
        Task<bool> DeleteTransactionAsync(int id);
    }
}