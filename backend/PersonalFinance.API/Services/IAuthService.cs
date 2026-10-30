using PersonalFinance.API.Models;

namespace PersonalFinance.API.Services
{
    public interface IAuthService
    {
        Task<AuthResponse> RegisterAsync(RegisterRequest request);
        Task<AuthResponse> LoginAsync(LoginRequest request);
        Task<AuthResponse> ExternalLoginAsync(ExternalAuthRequest request);
        Task<AuthResponse> RefreshTokenAsync(string refreshToken, string? ipAddress, string? deviceInfo);
        Task RevokeTokenAsync(string refreshToken);
        Task RevokeAllUserTokensAsync(int userId);
        Task<UserDto> GetUserByIdAsync(int userId);
        Task LinkExternalProviderAsync(int userId, ExternalAuthRequest request);
        Task UnlinkExternalProviderAsync(int userId, string provider);
        Task<List<SessionDto>> GetActiveSessionsAsync(int userId, string? currentToken);
        Task RevokeSessionAsync(int userId, int tokenId);
    }
}
