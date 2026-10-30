using PersonalFinance.API.Models;

namespace PersonalFinance.API.Services
{
    public interface ICategorizationService
    {
        Task<CategorizationResponse> SuggestCategoryAsync(string description);
        Task<BatchCategorizationResult> CategorizeUncategorizedTransactionsAsync(int? accountId = null);
    }

    public class BatchCategorizationResult
    {
        public int TotalProcessed { get; set; }
        public int Categorized { get; set; }
        public int Skipped { get; set; }
        public List<string> Errors { get; set; } = new();
    }
}
