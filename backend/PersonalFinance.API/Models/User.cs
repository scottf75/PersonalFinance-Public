using PetaPoco;

namespace PersonalFinance.API.Models
{
    [TableName("user")]
    [PrimaryKey("id")]
    public class User
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("email")]
        public string Email { get; set; } = string.Empty;

        [Column("passwordhash")]
        public string? PasswordHash { get; set; }

        [Column("firstname")]
        public string? FirstName { get; set; }

        [Column("lastname")]
        public string? LastName { get; set; }

        [Column("avatarurl")]
        public string? AvatarUrl { get; set; }

        [Column("emailverified")]
        public bool EmailVerified { get; set; }

        [Column("createdat")]
        public DateTime CreatedAt { get; set; }

        [Column("updatedat")]
        public DateTime UpdatedAt { get; set; }
    }

    [TableName("externallogin")]
    [PrimaryKey("id")]
    public class ExternalLogin
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("userid")]
        public int UserId { get; set; }

        [Column("provider")]
        public string Provider { get; set; } = string.Empty;

        [Column("providerid")]
        public string ProviderId { get; set; } = string.Empty;

        [Column("provideremail")]
        public string? ProviderEmail { get; set; }

        [Column("createdat")]
        public DateTime CreatedAt { get; set; }
    }

    [TableName("refreshtoken")]
    [PrimaryKey("id")]
    public class RefreshToken
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("userid")]
        public int UserId { get; set; }

        [Column("token")]
        public string Token { get; set; } = string.Empty;

        [Column("deviceinfo")]
        public string? DeviceInfo { get; set; }

        [Column("ipaddress")]
        public string? IpAddress { get; set; }

        [Column("expiresat")]
        public DateTime ExpiresAt { get; set; }

        [Column("revokedat")]
        public DateTime? RevokedAt { get; set; }

        [Column("createdat")]
        public DateTime CreatedAt { get; set; }

        [Ignore]
        public bool IsExpired => DateTime.UtcNow >= ExpiresAt;

        [Ignore]
        public bool IsRevoked => RevokedAt.HasValue;

        [Ignore]
        public bool IsActive => !IsRevoked && !IsExpired;
    }
}
