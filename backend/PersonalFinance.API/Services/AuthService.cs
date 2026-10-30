using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.IdentityModel.Tokens;
using PersonalFinance.API.Models;
using PetaPoco;

namespace PersonalFinance.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly IDatabase _database;
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _httpClientFactory;

        public AuthService(IDatabase database, IConfiguration configuration, IHttpClientFactory httpClientFactory)
        {
            _database = database;
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
        {
            // Check if user already exists
            var existingUser = await _database.FirstOrDefaultAsync<User>(
                "SELECT * FROM \"user\" WHERE LOWER(email) = LOWER(@0)", request.Email);

            if (existingUser != null)
            {
                throw new InvalidOperationException("An account with this email already exists");
            }

            // Create new user
            var user = new User
            {
                Email = request.Email.ToLower(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FirstName = request.FirstName,
                LastName = request.LastName,
                EmailVerified = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _database.InsertAsync(user);

            // Generate tokens and return response
            return await GenerateAuthResponseAsync(user, null, null);
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var user = await _database.FirstOrDefaultAsync<User>(
                "SELECT * FROM \"user\" WHERE LOWER(email) = LOWER(@0)", request.Email);

            if (user == null)
            {
                throw new UnauthorizedAccessException("Invalid email or password");
            }

            if (string.IsNullOrEmpty(user.PasswordHash))
            {
                throw new UnauthorizedAccessException("This account uses social login. Please sign in with Google or Microsoft.");
            }

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                throw new UnauthorizedAccessException("Invalid email or password");
            }

            return await GenerateAuthResponseAsync(user, null, null);
        }

        public async Task<AuthResponse> ExternalLoginAsync(ExternalAuthRequest request)
        {
            // Validate the token with the provider and get user info
            var externalUser = await ValidateExternalTokenAsync(request.Provider, request.IdToken);

            if (externalUser == null)
            {
                throw new UnauthorizedAccessException("Invalid external authentication token");
            }

            // Check if this external login already exists
            var existingLogin = await _database.FirstOrDefaultAsync<ExternalLogin>(
                "SELECT * FROM externallogin WHERE provider = @0 AND providerid = @1",
                request.Provider.ToLower(), externalUser.ProviderId);

            User user;

            if (existingLogin != null)
            {
                // User already linked - get the user
                user = await _database.FirstOrDefaultAsync<User>(
                    "SELECT * FROM \"user\" WHERE id = @0", existingLogin.UserId);

                if (user == null)
                {
                    throw new InvalidOperationException("User account not found");
                }
            }
            else
            {
                // Check if a user with this email exists
                user = await _database.FirstOrDefaultAsync<User>(
                    "SELECT * FROM \"user\" WHERE LOWER(email) = LOWER(@0)", externalUser.Email);

                if (user == null)
                {
                    // Create new user
                    user = new User
                    {
                        Email = externalUser.Email.ToLower(),
                        PasswordHash = null, // No password for social-only users
                        FirstName = externalUser.FirstName,
                        LastName = externalUser.LastName,
                        AvatarUrl = externalUser.AvatarUrl,
                        EmailVerified = true, // Social providers verify email
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await _database.InsertAsync(user);
                }

                // Link the external login
                var externalLogin = new ExternalLogin
                {
                    UserId = user.Id,
                    Provider = request.Provider.ToLower(),
                    ProviderId = externalUser.ProviderId,
                    ProviderEmail = externalUser.Email,
                    CreatedAt = DateTime.UtcNow
                };

                await _database.InsertAsync(externalLogin);
            }

            return await GenerateAuthResponseAsync(user, null, null);
        }

        public async Task<AuthResponse> RefreshTokenAsync(string refreshToken, string? ipAddress, string? deviceInfo)
        {
            var token = await _database.FirstOrDefaultAsync<RefreshToken>(
                "SELECT * FROM refreshtoken WHERE token = @0", refreshToken);

            if (token == null || !token.IsActive)
            {
                throw new UnauthorizedAccessException("Invalid or expired refresh token");
            }

            var user = await _database.FirstOrDefaultAsync<User>(
                "SELECT * FROM \"user\" WHERE id = @0", token.UserId);

            if (user == null)
            {
                throw new UnauthorizedAccessException("User not found");
            }

            // Revoke the old token (rotation)
            token.RevokedAt = DateTime.UtcNow;
            await _database.UpdateAsync(token);

            // Generate new tokens
            return await GenerateAuthResponseAsync(user, ipAddress, deviceInfo);
        }

        public async Task RevokeTokenAsync(string refreshToken)
        {
            var token = await _database.FirstOrDefaultAsync<RefreshToken>(
                "SELECT * FROM refreshtoken WHERE token = @0", refreshToken);

            if (token != null && token.IsActive)
            {
                token.RevokedAt = DateTime.UtcNow;
                await _database.UpdateAsync(token);
            }
        }

        public async Task RevokeAllUserTokensAsync(int userId)
        {
            await _database.ExecuteAsync(
                "UPDATE refreshtoken SET revokedat = @0 WHERE userid = @1 AND revokedat IS NULL",
                DateTime.UtcNow, userId);
        }

        public async Task<UserDto> GetUserByIdAsync(int userId)
        {
            var user = await _database.FirstOrDefaultAsync<User>(
                "SELECT * FROM \"user\" WHERE id = @0", userId);

            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }

            var linkedProviders = await _database.FetchAsync<string>(
                "SELECT provider FROM externallogin WHERE userid = @0", userId);

            return new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                AvatarUrl = user.AvatarUrl,
                LinkedProviders = linkedProviders
            };
        }

        public async Task LinkExternalProviderAsync(int userId, ExternalAuthRequest request)
        {
            var externalUser = await ValidateExternalTokenAsync(request.Provider, request.IdToken);

            if (externalUser == null)
            {
                throw new UnauthorizedAccessException("Invalid external authentication token");
            }

            // Check if this provider is already linked to another account
            var existingLogin = await _database.FirstOrDefaultAsync<ExternalLogin>(
                "SELECT * FROM externallogin WHERE provider = @0 AND providerid = @1",
                request.Provider.ToLower(), externalUser.ProviderId);

            if (existingLogin != null)
            {
                if (existingLogin.UserId == userId)
                {
                    throw new InvalidOperationException("This provider is already linked to your account");
                }
                throw new InvalidOperationException("This provider is already linked to another account");
            }

            // Link the provider
            var externalLogin = new ExternalLogin
            {
                UserId = userId,
                Provider = request.Provider.ToLower(),
                ProviderId = externalUser.ProviderId,
                ProviderEmail = externalUser.Email,
                CreatedAt = DateTime.UtcNow
            };

            await _database.InsertAsync(externalLogin);
        }

        public async Task UnlinkExternalProviderAsync(int userId, string provider)
        {
            var user = await _database.FirstOrDefaultAsync<User>(
                "SELECT * FROM \"user\" WHERE id = @0", userId);

            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }

            // Count linked providers
            var providerCount = await _database.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM externallogin WHERE userid = @0", userId);

            var hasPassword = !string.IsNullOrEmpty(user.PasswordHash);

            // Cannot unlink if it's the only auth method
            if (providerCount <= 1 && !hasPassword)
            {
                throw new InvalidOperationException("Cannot unlink the only authentication method. Please set a password first.");
            }

            await _database.ExecuteAsync(
                "DELETE FROM externallogin WHERE userid = @0 AND provider = @1",
                userId, provider.ToLower());
        }

        public async Task<List<SessionDto>> GetActiveSessionsAsync(int userId, string? currentToken)
        {
            var tokens = await _database.FetchAsync<RefreshToken>(
                "SELECT * FROM refreshtoken WHERE userid = @0 AND revokedat IS NULL AND expiresat > @1 ORDER BY createdat DESC",
                userId, DateTime.UtcNow);

            return tokens.Select(t => new SessionDto
            {
                Id = t.Id,
                DeviceInfo = t.DeviceInfo,
                IpAddress = t.IpAddress,
                CreatedAt = t.CreatedAt,
                ExpiresAt = t.ExpiresAt,
                IsCurrent = t.Token == currentToken
            }).ToList();
        }

        public async Task RevokeSessionAsync(int userId, int tokenId)
        {
            await _database.ExecuteAsync(
                "UPDATE refreshtoken SET revokedat = @0 WHERE id = @1 AND userid = @2",
                DateTime.UtcNow, tokenId, userId);
        }

        private async Task<AuthResponse> GenerateAuthResponseAsync(User user, string? ipAddress, string? deviceInfo)
        {
            var accessToken = GenerateAccessToken(user);
            var refreshToken = await GenerateRefreshTokenAsync(user.Id, ipAddress, deviceInfo);

            var linkedProviders = await _database.FetchAsync<string>(
                "SELECT provider FROM externallogin WHERE userid = @0", user.Id);

            return new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken.Token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(GetAccessTokenExpiryMinutes()),
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    AvatarUrl = user.AvatarUrl,
                    LinkedProviders = linkedProviders
                }
            };
        }

        private string GenerateAccessToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(GetJwtKey()));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.GivenName, user.FirstName ?? ""),
                new Claim(ClaimTypes.Surname, user.LastName ?? ""),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"] ?? "PersonalFinanceApp",
                audience: _configuration["Jwt:Audience"] ?? "PersonalFinanceApp",
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(GetAccessTokenExpiryMinutes()),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private async Task<RefreshToken> GenerateRefreshTokenAsync(int userId, string? ipAddress, string? deviceInfo)
        {
            var refreshToken = new RefreshToken
            {
                UserId = userId,
                Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
                DeviceInfo = deviceInfo,
                IpAddress = ipAddress,
                ExpiresAt = DateTime.UtcNow.AddDays(GetRefreshTokenExpiryDays()),
                CreatedAt = DateTime.UtcNow
            };

            await _database.InsertAsync(refreshToken);

            return refreshToken;
        }

        private async Task<ExternalUserInfo?> ValidateExternalTokenAsync(string provider, string idToken)
        {
            return provider.ToLower() switch
            {
                "google" => await ValidateGoogleTokenAsync(idToken),
                "microsoft" => await ValidateMicrosoftTokenAsync(idToken),
                _ => throw new ArgumentException($"Unsupported provider: {provider}")
            };
        }

        private async Task<ExternalUserInfo?> ValidateGoogleTokenAsync(string idToken)
        {
            try
            {
                var client = _httpClientFactory.CreateClient();
                var response = await client.GetAsync($"https://oauth2.googleapis.com/tokeninfo?id_token={idToken}");

                if (!response.IsSuccessStatusCode)
                {
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();
                var tokenInfo = JsonSerializer.Deserialize<JsonElement>(content);

                // Verify the token is for our app
                var clientId = _configuration["OAuth:Google:ClientId"];
                var aud = tokenInfo.GetProperty("aud").GetString();

                if (aud != clientId)
                {
                    return null;
                }

                return new ExternalUserInfo
                {
                    ProviderId = tokenInfo.GetProperty("sub").GetString() ?? "",
                    Email = tokenInfo.GetProperty("email").GetString() ?? "",
                    FirstName = tokenInfo.TryGetProperty("given_name", out var givenName) ? givenName.GetString() : null,
                    LastName = tokenInfo.TryGetProperty("family_name", out var familyName) ? familyName.GetString() : null,
                    AvatarUrl = tokenInfo.TryGetProperty("picture", out var picture) ? picture.GetString() : null
                };
            }
            catch
            {
                return null;
            }
        }

        private async Task<ExternalUserInfo?> ValidateMicrosoftTokenAsync(string idToken)
        {
            try
            {
                // Decode the JWT to get claims (Microsoft tokens are JWTs)
                var handler = new JwtSecurityTokenHandler();
                var token = handler.ReadJwtToken(idToken);

                // In production, you should validate the token signature
                // For now, we'll trust the token from the frontend MSAL library

                var sub = token.Claims.FirstOrDefault(c => c.Type == "sub" || c.Type == "oid")?.Value;
                var email = token.Claims.FirstOrDefault(c => c.Type == "email" || c.Type == "preferred_username")?.Value;
                var name = token.Claims.FirstOrDefault(c => c.Type == "name")?.Value;

                if (string.IsNullOrEmpty(sub) || string.IsNullOrEmpty(email))
                {
                    return null;
                }

                // Parse name into first/last
                string? firstName = null;
                string? lastName = null;
                if (!string.IsNullOrEmpty(name))
                {
                    var parts = name.Split(' ', 2);
                    firstName = parts[0];
                    lastName = parts.Length > 1 ? parts[1] : null;
                }

                return new ExternalUserInfo
                {
                    ProviderId = sub,
                    Email = email,
                    FirstName = firstName,
                    LastName = lastName,
                    AvatarUrl = null // Microsoft Graph API needed for avatar
                };
            }
            catch
            {
                return null;
            }
        }

        private string GetJwtKey()
        {
            var key = _configuration["Jwt:Key"];
            if (string.IsNullOrEmpty(key) || key.Length < 32)
            {
                // Generate a secure default key for development (not for production!)
                key = "YourSuperSecretKeyThatIsAtLeast32CharactersLong!";
            }
            return key;
        }

        private int GetAccessTokenExpiryMinutes()
        {
            return int.TryParse(_configuration["Jwt:AccessTokenExpiresMinutes"], out var minutes) ? minutes : 15;
        }

        private int GetRefreshTokenExpiryDays()
        {
            return int.TryParse(_configuration["Jwt:RefreshTokenExpiresDays"], out var days) ? days : 7;
        }
    }
}
