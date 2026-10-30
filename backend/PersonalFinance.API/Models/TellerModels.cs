using System.Text.Json.Serialization;

namespace PersonalFinance.API.Models
{
    // DTOs for Teller.io API responses

    public class TellerAccount
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        [JsonPropertyName("subtype")]
        public string? Subtype { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("institution")]
        public TellerInstitution Institution { get; set; } = new();

        [JsonPropertyName("currency")]
        public string Currency { get; set; } = "USD";

        [JsonPropertyName("enrollment_id")]
        public string EnrollmentId { get; set; } = string.Empty;

        [JsonPropertyName("last_four")]
        public string? LastFour { get; set; }
    }

    public class TellerInstitution
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
    }

    public class TellerBalance
    {
        [JsonPropertyName("account_id")]
        public string AccountId { get; set; } = string.Empty;

        [JsonPropertyName("available")]
        public string? Available { get; set; }

        [JsonPropertyName("ledger")]
        public string? Ledger { get; set; }
    }

    public class TellerTransaction
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("account_id")]
        public string AccountId { get; set; } = string.Empty;

        [JsonPropertyName("date")]
        public string Date { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("amount")]
        public string Amount { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        [JsonPropertyName("details")]
        public TellerTransactionDetails? Details { get; set; }
    }

    public class TellerTransactionDetails
    {
        [JsonPropertyName("category")]
        public string? Category { get; set; }

        [JsonPropertyName("counterparty")]
        public TellerCounterparty? Counterparty { get; set; }

        [JsonPropertyName("processing_status")]
        public string? ProcessingStatus { get; set; }
    }

    public class TellerCounterparty
    {
        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("type")]
        public string? Type { get; set; }
    }

    // Request/Response DTOs for our API

    public class LinkBankRequest
    {
        [JsonPropertyName("enrollmentId")]
        public string EnrollmentId { get; set; } = string.Empty;

        [JsonPropertyName("accessToken")]
        public string AccessToken { get; set; } = string.Empty;

        [JsonPropertyName("institutionName")]
        public string? InstitutionName { get; set; }
    }

    public class SyncResult
    {
        [JsonPropertyName("accountId")]
        public int AccountId { get; set; }

        [JsonPropertyName("accountName")]
        public string AccountName { get; set; } = string.Empty;

        [JsonPropertyName("transactionsImported")]
        public int TransactionsImported { get; set; }

        [JsonPropertyName("transactionsSkipped")]
        public int TransactionsSkipped { get; set; }

        [JsonPropertyName("newBalance")]
        public decimal? NewBalance { get; set; }

        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("errorMessage")]
        public string? ErrorMessage { get; set; }
    }

    public class TellerStatusResponse
    {
        [JsonPropertyName("enrollments")]
        public List<EnrollmentStatus> Enrollments { get; set; } = new();
    }

    public class EnrollmentStatus
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("enrollmentId")]
        public string EnrollmentId { get; set; } = string.Empty;

        [JsonPropertyName("institutionName")]
        public string? InstitutionName { get; set; }

        [JsonPropertyName("lastSyncAt")]
        public DateTime? LastSyncAt { get; set; }

        [JsonPropertyName("isActive")]
        public bool IsActive { get; set; }

        [JsonPropertyName("accounts")]
        public List<LinkedAccountStatus> Accounts { get; set; } = new();
    }

    public class LinkedAccountStatus
    {
        [JsonPropertyName("accountId")]
        public int AccountId { get; set; }

        [JsonPropertyName("accountName")]
        public string AccountName { get; set; } = string.Empty;

        [JsonPropertyName("tellerAccountId")]
        public string? TellerAccountId { get; set; }

        [JsonPropertyName("lastSyncDate")]
        public DateTime? LastSyncDate { get; set; }
    }
}
