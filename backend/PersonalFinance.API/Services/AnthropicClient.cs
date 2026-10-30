using System.Text;
using System.Text.Json;

namespace PersonalFinance.API.Services
{
    public class AnthropicClient : IAnthropicClient
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AnthropicClient> _logger;

        public AnthropicClient(HttpClient httpClient, IConfiguration configuration, ILogger<AnthropicClient> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<string> SendMessageAsync(string systemPrompt, string userMessage)
        {
            var apiKey = _configuration["Anthropic:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogWarning("Anthropic API key not configured");
                return string.Empty;
            }

            var model = _configuration["Anthropic:Model"] ?? "claude-haiku-4-5-20251001";
            var maxTokens = int.Parse(_configuration["Anthropic:MaxTokens"] ?? "150");

            var requestBody = new
            {
                model = model,
                max_tokens = maxTokens,
                system = systemPrompt,
                messages = new[]
                {
                    new { role = "user", content = userMessage }
                }
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages");
            request.Content = content;
            request.Headers.Add("x-api-key", apiKey);
            request.Headers.Add("anthropic-version", "2023-06-01");

            try
            {
                _logger.LogInformation("Calling Anthropic API with model: {Model}", model);
                _logger.LogInformation("Request URL: {Url}", request.RequestUri);
                _logger.LogInformation("Request body: {Body}", json);

                var response = await _httpClient.SendAsync(request);

                _logger.LogInformation("Response status: {StatusCode}", response.StatusCode);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Anthropic API error: {StatusCode} - {Content}", response.StatusCode, errorContent);
                    return string.Empty;
                }

                var responseJson = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseJson);

                var textContent = doc.RootElement
                    .GetProperty("content")[0]
                    .GetProperty("text")
                    .GetString();

                return textContent ?? string.Empty;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Anthropic API");
                return string.Empty;
            }
        }
    }
}
