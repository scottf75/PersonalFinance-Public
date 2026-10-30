namespace PersonalFinance.API.Models
{
    public class SearchParseRequest
    {
        public string Query { get; set; } = string.Empty;
        public int? AccountId { get; set; }
    }
}
