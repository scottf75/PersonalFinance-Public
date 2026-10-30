namespace PersonalFinance.API.Models
{
    public class SearchFilters
    {
        public string? Keywords { get; set; }
        public int[]? CategoryIds { get; set; }
        public decimal? MinAmount { get; set; }
        public decimal? MaxAmount { get; set; }
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
        public int? AccountId { get; set; }
    }
}
