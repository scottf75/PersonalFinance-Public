using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Caching.Memory;
using PersonalFinance.API.Models;
using PetaPoco;

namespace PersonalFinance.API.Services
{
    public class CategorizationService : ICategorizationService
    {
        private readonly ICategoryService _categoryService;
        private readonly IAnthropicClient _anthropicClient;
        private readonly IMemoryCache _cache;
        private readonly ILogger<CategorizationService> _logger;
        private readonly IDatabase _database;

        private const string SystemPrompt = @"You are a financial transaction categorizer. Given a transaction description and a list of available categories, determine the most appropriate category.

Rules:
1. You MUST only suggest categories from the provided list
2. Return ONLY a JSON object with: categoryId, categoryName, confidence (0.0-1.0), reasoning
3. If no category is a good match, return categoryId: null with confidence: 0
4. Base confidence on how certain you are:
   - 0.9-1.0: Very clear match (e.g., ""WALMART GROCERY"" → Groceries)
   - 0.7-0.8: Likely match (e.g., ""WMT STORE"" → Groceries)
   - 0.5-0.6: Possible match, user should verify
   - Below 0.5: Don't suggest

Common transaction description patterns:
- Merchant names may be abbreviated
- May include location codes, transaction IDs
- May be in ALL CAPS

Return ONLY valid JSON, no other text.";

        public CategorizationService(
            ICategoryService categoryService,
            IAnthropicClient anthropicClient,
            IMemoryCache cache,
            ILogger<CategorizationService> logger,
            IDatabase database)
        {
            _categoryService = categoryService;
            _anthropicClient = anthropicClient;
            _cache = cache;
            _logger = logger;
            _database = database;
        }

        public async Task<CategorizationResponse> SuggestCategoryAsync(string description)
        {
            if (string.IsNullOrWhiteSpace(description) || description.Length < 3)
            {
                return new CategorizationResponse { Confidence = 0 };
            }

            var cacheKey = GetCacheKey(description);

            if (_cache.TryGetValue(cacheKey, out CategorizationResponse? cachedResponse) && cachedResponse != null)
            {
                _logger.LogDebug("Cache hit for description: {Description}", description);
                return cachedResponse;
            }

            var categories = _categoryService.GetAllCategories().ToList();
            if (!categories.Any())
            {
                return new CategorizationResponse { Confidence = 0 };
            }

            var categoriesJson = JsonSerializer.Serialize(categories.Select(c => new { id = c.ID, name = c.Name }));
            var userMessage = $"Transaction description: \"{description}\"\n\nAvailable categories:\n{categoriesJson}\n\nRespond with JSON only:";

            var responseText = await _anthropicClient.SendMessageAsync(SystemPrompt, userMessage);

            if (string.IsNullOrEmpty(responseText))
            {
                return new CategorizationResponse { Confidence = 0 };
            }

            var response = ParseResponse(responseText, categories);

            var cacheOptions = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromHours(24))
                .SetSlidingExpiration(TimeSpan.FromHours(6));

            _cache.Set(cacheKey, response, cacheOptions);

            return response;
        }

        private string GetCacheKey(string description)
        {
            var normalized = Regex.Replace(description.ToLowerInvariant().Trim(), @"\s+", " ");
            return $"category_suggestion:{normalized}";
        }

        private CategorizationResponse ParseResponse(string responseText, List<Category> categories)
        {
            try
            {
                // Strip markdown code blocks if present
                var jsonText = responseText.Trim();
                if (jsonText.StartsWith("```"))
                {
                    // Remove opening ``` or ```json
                    var firstNewline = jsonText.IndexOf('\n');
                    if (firstNewline > 0)
                    {
                        jsonText = jsonText.Substring(firstNewline + 1);
                    }
                    // Remove closing ```
                    var lastBackticks = jsonText.LastIndexOf("```");
                    if (lastBackticks > 0)
                    {
                        jsonText = jsonText.Substring(0, lastBackticks);
                    }
                    jsonText = jsonText.Trim();
                }

                using var doc = JsonDocument.Parse(jsonText);
                var root = doc.RootElement;

                int? categoryId = null;
                if (root.TryGetProperty("categoryId", out var catIdElement) && catIdElement.ValueKind != JsonValueKind.Null)
                {
                    categoryId = catIdElement.GetInt32();
                }

                string? categoryName = null;
                if (root.TryGetProperty("categoryName", out var catNameElement))
                {
                    categoryName = catNameElement.GetString();
                }

                double confidence = 0;
                if (root.TryGetProperty("confidence", out var confElement))
                {
                    confidence = confElement.GetDouble();
                }

                string? reasoning = null;
                if (root.TryGetProperty("reasoning", out var reasonElement))
                {
                    reasoning = reasonElement.GetString();
                }

                // Validate categoryId exists in our categories
                if (categoryId.HasValue && !categories.Any(c => c.ID == categoryId.Value))
                {
                    _logger.LogWarning("AI suggested invalid categoryId: {CategoryId}", categoryId);
                    return new CategorizationResponse { Confidence = 0 };
                }

                return new CategorizationResponse
                {
                    SuggestedCategoryId = categoryId,
                    SuggestedCategoryName = categoryName,
                    Confidence = confidence,
                    Reasoning = reasoning
                };
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Failed to parse AI response: {Response}", responseText);
                return new CategorizationResponse { Confidence = 0 };
            }
        }

        public async Task<BatchCategorizationResult> CategorizeUncategorizedTransactionsAsync(int? accountId = null)
        {
            var result = new BatchCategorizationResult();

            try
            {
                // Get the "Uncategorized" category ID
                var categories = _categoryService.GetAllCategories().ToList();
                var uncategorizedCategory = categories.FirstOrDefault(c =>
                    c.Name.Equals("Uncategorized", StringComparison.OrdinalIgnoreCase));

                if (uncategorizedCategory == null)
                {
                    result.Errors.Add("Uncategorized category not found");
                    return result;
                }

                // Get all uncategorized transactions
                var sql = @"SELECT * FROM transaction WHERE categoryid = @0";
                if (accountId.HasValue)
                {
                    sql += " AND accountid = @1";
                }

                var transactions = accountId.HasValue
                    ? await _database.FetchAsync<Transactional>(sql, uncategorizedCategory.ID, accountId.Value)
                    : await _database.FetchAsync<Transactional>(sql, uncategorizedCategory.ID);

                _logger.LogInformation("Found {Count} uncategorized transactions to process", transactions.Count);

                foreach (var transaction in transactions)
                {
                    result.TotalProcessed++;

                    try
                    {
                        var suggestion = await SuggestCategoryAsync(transaction.Description);

                        if (suggestion.SuggestedCategoryId.HasValue && suggestion.Confidence >= 0.7)
                        {
                            transaction.CategoryID = suggestion.SuggestedCategoryId.Value;
                            await _database.UpdateAsync("transaction", "id", transaction, transaction.ID);
                            result.Categorized++;
                            _logger.LogDebug("Categorized transaction {Id} as {Category}",
                                transaction.ID, suggestion.SuggestedCategoryName);
                        }
                        else
                        {
                            result.Skipped++;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to categorize transaction {Id}", transaction.ID);
                        result.Errors.Add($"Transaction {transaction.ID}: {ex.Message}");
                        result.Skipped++;
                    }
                }

                _logger.LogInformation("Batch categorization complete: {Categorized} categorized, {Skipped} skipped",
                    result.Categorized, result.Skipped);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Batch categorization failed");
                result.Errors.Add(ex.Message);
            }

            return result;
        }
    }
}
