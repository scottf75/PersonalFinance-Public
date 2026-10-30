using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalFinance.API.Helpers;
using PersonalFinance.API.Models;
using PersonalFinance.API.Services;

namespace PersonalFinance.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IUserContext _userContext;

        public AuthController(IAuthService authService, IUserContext userContext)
        {
            _authService = authService;
            _userContext = userContext;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
        {
            try
            {
                var response = await _authService.RegisterAsync(request);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred during registration", error = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
        {
            try
            {
                var ipAddress = GetIpAddress();
                var deviceInfo = GetDeviceInfo();
                var response = await _authService.LoginAsync(request);
                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred during login", error = ex.Message });
            }
        }

        [HttpPost("external")]
        public async Task<ActionResult<AuthResponse>> ExternalLogin([FromBody] ExternalAuthRequest request)
        {
            try
            {
                var response = await _authService.ExternalLoginAsync(request);
                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred during external login", error = ex.Message });
            }
        }

        [HttpPost("refresh")]
        public async Task<ActionResult<AuthResponse>> RefreshToken([FromBody] RefreshRequest request)
        {
            try
            {
                var ipAddress = GetIpAddress();
                var deviceInfo = GetDeviceInfo();
                var response = await _authService.RefreshTokenAsync(request.RefreshToken, ipAddress, deviceInfo);
                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred during token refresh", error = ex.Message });
            }
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] RefreshRequest? request)
        {
            try
            {
                if (!string.IsNullOrEmpty(request?.RefreshToken))
                {
                    await _authService.RevokeTokenAsync(request.RefreshToken);
                }
                return Ok(new { message = "Logged out successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred during logout", error = ex.Message });
            }
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            try
            {
                var userId = _userContext.GetCurrentUserId();
                var user = await _authService.GetUserByIdAsync(userId);
                return Ok(user);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { message = "Not authenticated" });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        [Authorize]
        [HttpPost("link/{provider}")]
        public async Task<IActionResult> LinkProvider(string provider, [FromBody] ExternalAuthRequest request)
        {
            try
            {
                var userId = _userContext.GetCurrentUserId();
                request.Provider = provider; // Override with URL parameter
                await _authService.LinkExternalProviderAsync(userId, request);
                return Ok(new { message = $"{provider} account linked successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        [Authorize]
        [HttpDelete("link/{provider}")]
        public async Task<IActionResult> UnlinkProvider(string provider)
        {
            try
            {
                var userId = _userContext.GetCurrentUserId();
                await _authService.UnlinkExternalProviderAsync(userId, provider);
                return Ok(new { message = $"{provider} account unlinked successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        [Authorize]
        [HttpGet("sessions")]
        public async Task<ActionResult<List<SessionDto>>> GetActiveSessions()
        {
            try
            {
                var userId = _userContext.GetCurrentUserId();
                // Get current refresh token from request header or body if available
                var currentToken = Request.Headers["X-Refresh-Token"].FirstOrDefault();
                var sessions = await _authService.GetActiveSessionsAsync(userId, currentToken);
                return Ok(sessions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        [Authorize]
        [HttpDelete("sessions/{tokenId}")]
        public async Task<IActionResult> RevokeSession(int tokenId)
        {
            try
            {
                var userId = _userContext.GetCurrentUserId();
                await _authService.RevokeSessionAsync(userId, tokenId);
                return Ok(new { message = "Session revoked successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        private string? GetIpAddress()
        {
            // Check for forwarded IP (behind proxy/load balancer)
            if (Request.Headers.ContainsKey("X-Forwarded-For"))
            {
                return Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',').FirstOrDefault()?.Trim();
            }
            return HttpContext.Connection.RemoteIpAddress?.ToString();
        }

        private string? GetDeviceInfo()
        {
            return Request.Headers["User-Agent"].FirstOrDefault();
        }
    }
}
