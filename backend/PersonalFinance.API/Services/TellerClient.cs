using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using PersonalFinance.API.Models;

namespace PersonalFinance.API.Services
{
    public class TellerClient : ITellerClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<TellerClient> _logger;
        private const string BaseUrl = "https://api.teller.io";

        public TellerClient(HttpClient httpClient, ILogger<TellerClient> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<IEnumerable<TellerAccount>> GetAccountsAsync(string accessToken)
        {
            try
            {
                _logger.LogInformation("Fetching accounts from Teller API with token: {TokenPrefix}...",
                    accessToken?.Substring(0, Math.Min(10, accessToken?.Length ?? 0)));

                var request = CreateAuthenticatedRequest(HttpMethod.Get, $"{BaseUrl}/accounts", accessToken);
                var response = await _httpClient.SendAsync(request);

                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Teller API error getting accounts: {StatusCode} - {Content}",
                        response.StatusCode, responseContent);
                    throw new Exception($"Teller API returned {response.StatusCode}: {responseContent}");
                }

                _logger.LogInformation("Teller API response: {Content}", responseContent);
                var accounts = JsonSerializer.Deserialize<List<TellerAccount>>(responseContent);
                _logger.LogInformation("Deserialized {Count} accounts from Teller", accounts?.Count ?? 0);
                return accounts ?? Enumerable.Empty<TellerAccount>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching accounts from Teller API");
                throw;
            }
        }

        public async Task<TellerBalance?> GetAccountBalanceAsync(string accessToken, string accountId)
        {
            try
            {
                var request = CreateAuthenticatedRequest(
                    HttpMethod.Get,
                    $"{BaseUrl}/accounts/{accountId}/balances",
                    accessToken);

                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Teller API error getting balance for {AccountId}: {StatusCode} - {Content}",
                        accountId, response.StatusCode, errorContent);
                    return null;
                }

                var json = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<TellerBalance>(json);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching balance for account {AccountId} from Teller API", accountId);
                return null;
            }
        }

        public async Task<IEnumerable<TellerTransaction>> GetTransactionsAsync(
            string accessToken,
            string accountId,
            DateTime? fromDate = null)
        {
            try
            {
                var url = $"{BaseUrl}/accounts/{accountId}/transactions";
                if (fromDate.HasValue)
                {
                    url += $"?from_date={fromDate.Value:yyyy-MM-dd}";
                }

                var request = CreateAuthenticatedRequest(HttpMethod.Get, url, accessToken);
                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Teller API error getting transactions for {AccountId}: {StatusCode} - {Content}",
                        accountId, response.StatusCode, errorContent);
                    return Enumerable.Empty<TellerTransaction>();
                }

                var json = await response.Content.ReadAsStringAsync();
                var transactions = JsonSerializer.Deserialize<List<TellerTransaction>>(json);
                return transactions ?? Enumerable.Empty<TellerTransaction>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching transactions for account {AccountId} from Teller API", accountId);
                throw;
            }
        }

        private HttpRequestMessage CreateAuthenticatedRequest(HttpMethod method, string url, string accessToken)
        {
            var request = new HttpRequestMessage(method, url);
            // Teller uses Basic Auth with the access token as the username and empty password
            var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{accessToken}:"));
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);
            return request;
        }
    }
}
