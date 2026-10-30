namespace PersonalFinance.API.Models
{
    public class CategorizationResponse
    {
        public int? SuggestedCategoryId { get; set; }
        public string? SuggestedCategoryName { get; set; }
        public double Confidence { get; set; }
        public string? Reasoning { get; set; }
    }
}
