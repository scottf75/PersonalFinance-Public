using PersonalFinance.API.Models;

namespace PersonalFinance.API.Services
{
    public interface ISearchParserService
    {
        Task<SearchParseResponse> ParseQueryAsync(string query, int? accountId = null);
    }
}
