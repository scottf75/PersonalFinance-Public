using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using PersonalFinance.API.Models;

namespace PersonalFinance.API.Services
{
    public class SearchParserService : ISearchParserService
    {
        private readonly ICategoryService _categoryService;
        private readonly IAnthropicClient _anthropicClient;
        private readonly IMemoryCache _cache;
        private readonly ILogger<SearchParserService> _logger;

        private const string SystemPrompt = @"You are a search query parser for a personal finance app. Parse the user's natural language query into structured filters. Today's date is {today}.

Available categories: {categories}

Return ONLY valid JSON with no markdown formatting:
{{
  ""filters"": {{
    ""keywords"": string|null,
    ""categoryIds"": int[]|null,
    ""minAmount"": number|null,
    ""maxAmount"": number|null,
    ""dateFrom"": ""YYYY-MM-DD""|null,
    ""dateTo"": ""YYYY-MM-DD""|null
  }},
  ""explanation"": ""Brief explanation of what you're filtering""
}}

Rules:
1. Handle relative dates: ""last month"", ""this year"", ""past 30 days"", ""yesterday"", etc.
2. If query mentions a category name, find the matching category ID from the list
3. For amount filters: ""over $50"" means minAmount=50, ""under $100"" means maxAmount=100
4. If query is just keywords with no filters, only set keywords field
5. Keywords should be text to search in transaction descriptions
6. Return valid JSON only, no additional text or markdown";

        public SearchParserService(
            ICategoryService categoryService,
            IAnthropicClient anthropicClient,
            IMemoryCache cache,
            ILogger<SearchParserService> logger)
        {
            _categoryService = categoryService;
            _anthropicClient = anthropicClient;
            _cache = cache;
            _logger = logger;
        }

        public async Task<SearchParseResponse> ParseQueryAsync(string query, int? accountId = null)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            {
                return new SearchParseResponse
                {
                    Filters = new SearchFilters { AccountId = accountId },
                    Explanation = null
                };
            }

            var cacheKey = GetCacheKey(query);

            if (_cache.TryGetValue(cacheKey, out SearchParseResponse? cachedResponse) && cachedResponse != null)
            {
                _logger.LogDebug("Cache hit for query: {Query}", query);
                var cached = cachedResponse;
                cached.Filters.AccountId = accountId;
                return cached;
            }

            var categories = _categoryService.GetAllCategories().ToList();
            var categoriesJson = JsonSerializer.Serialize(categories.Select(c => new { id = c.ID, name = c.Name }));

            var systemPromptWithContext = SystemPrompt
                .Replace("{today}", DateTime.Today.ToString("yyyy-MM-dd"))
                .Replace("{categories}", categoriesJson);

            var userMessage = $"Parse this search query: \"{query}\"";

            var responseText = await _anthropicClient.SendMessageAsync(systemPromptWithContext, userMessage);

            if (string.IsNullOrEmpty(responseText))
            {
                return new SearchParseResponse
                {
                    Filters = new SearchFilters { AccountId = accountId, Keywords = query },
                    Explanation = "Falling back to keyword search"
                };
            }

            var response = ParseResponse(responseText, accountId);

            var cacheOptions = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromHours(1))
                .SetSlidingExpiration(TimeSpan.FromMinutes(30));

            _cache.Set(cacheKey, response, cacheOptions);

            return response;
        }

        private string GetCacheKey(string query)
        {
            var normalized = query.ToLowerInvariant().Trim();
            return $"search_parse:{normalized}";
        }

        private SearchParseResponse ParseResponse(string responseText, int? accountId)
        {
            try
            {
                var jsonText = responseText.Trim();

                // Strip markdown code blocks if present
                if (jsonText.StartsWith("```"))
                {
                    var firstNewline = jsonText.IndexOf('\n');
                    if (firstNewline > 0)
                    {
                        jsonText = jsonText.Substring(firstNewline + 1);
                    }
                    var lastBackticks = jsonText.LastIndexOf("```");
                    if (lastBackticks > 0)
                    {
                        jsonText = jsonText.Substring(0, lastBackticks);
                    }
                    jsonText = jsonText.Trim();
                }

                using var doc = JsonDocument.Parse(jsonText);
                var root = doc.RootElement;

                var response = new SearchParseResponse();

                if (root.TryGetProperty("explanation", out var explanationElement))
                {
                    response.Explanation = explanationElement.GetString();
                }

                if (root.TryGetProperty("filters", out var filtersElement))
                {
                    var filters = new SearchFilters { AccountId = accountId };

                    if (filtersElement.TryGetProperty("keywords", out var keywordsElement) &&
                        keywordsElement.ValueKind != JsonValueKind.Null)
                    {
                        filters.Keywords = keywordsElement.GetString();
                    }

                    if (filtersElement.TryGetProperty("categoryIds", out var categoryIdsElement) &&
                        categoryIdsElement.ValueKind == JsonValueKind.Array)
                    {
                        var ids = new List<int>();
                        foreach (var id in categoryIdsElement.EnumerateArray())
                        {
                            if (id.ValueKind == JsonValueKind.Number)
                            {
                                ids.Add(id.GetInt32());
                            }
                        }
                        if (ids.Count > 0)
                        {
                            filters.CategoryIds = ids.ToArray();
                        }
                    }

                    if (filtersElement.TryGetProperty("minAmount", out var minAmountElement) &&
                        minAmountElement.ValueKind == JsonValueKind.Number)
                    {
                        filters.MinAmount = minAmountElement.GetDecimal();
                    }

                    if (filtersElement.TryGetProperty("maxAmount", out var maxAmountElement) &&
                        maxAmountElement.ValueKind == JsonValueKind.Number)
                    {
                        filters.MaxAmount = maxAmountElement.GetDecimal();
                    }

                    if (filtersElement.TryGetProperty("dateFrom", out var dateFromElement) &&
                        dateFromElement.ValueKind == JsonValueKind.String)
                    {
                        var dateStr = dateFromElement.GetString();
                        if (DateTime.TryParse(dateStr, out var dateFrom))
                        {
                            filters.DateFrom = dateFrom;
                        }
                    }

                    if (filtersElement.TryGetProperty("dateTo", out var dateToElement) &&
                        dateToElement.ValueKind == JsonValueKind.String)
                    {
                        var dateStr = dateToElement.GetString();
                        if (DateTime.TryParse(dateStr, out var dateTo))
                        {
                            filters.DateTo = dateTo;
                        }
                    }

                    response.Filters = filters;
                }
                else
                {
                    response.Filters = new SearchFilters { AccountId = accountId };
                }

                return response;
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Failed to parse AI response: {Response}", responseText);
                return new SearchParseResponse
                {
                    Filters = new SearchFilters { AccountId = accountId },
                    Explanation = "Failed to parse search query"
                };
            }
        }
    }
}
