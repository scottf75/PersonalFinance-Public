namespace PersonalFinance.API.Models
{
    public class SearchParseResponse
    {
        public SearchFilters Filters { get; set; } = new SearchFilters();
        public string? Explanation { get; set; }
    }
}
