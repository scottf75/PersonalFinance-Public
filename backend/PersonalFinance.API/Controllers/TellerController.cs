using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalFinance.API.Models;
using PersonalFinance.API.Services;

namespace PersonalFinance.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TellerController : ControllerBase
    {
        private readonly ITellerSyncService _tellerSyncService;
        private readonly ILogger<TellerController> _logger;

        public TellerController(ITellerSyncService tellerSyncService, ILogger<TellerController> logger)
        {
            _tellerSyncService = tellerSyncService;
            _logger = logger;
        }

        /// <summary>
        /// Store a new Teller enrollment after user completes Teller Connect flow
        /// </summary>
        [HttpPost("link")]
        public async Task<ActionResult<TellerEnrollment>> LinkBank([FromBody] LinkBankRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.EnrollmentId) || string.IsNullOrEmpty(request.AccessToken))
                {
                    return BadRequest("EnrollmentId and AccessToken are required");
                }

                var enrollment = await _tellerSyncService.LinkBankAsync(request);
                return Ok(enrollment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error linking bank");
                return StatusCode(500, new { message = "Failed to link bank", error = ex.Message });
            }
        }

        /// <summary>
        /// Get available Teller accounts for an enrollment to link to local accounts
        /// </summary>
        [HttpGet("enrollments/{enrollmentId}/accounts")]
        public async Task<ActionResult<IEnumerable<TellerAccount>>> GetTellerAccounts(int enrollmentId)
        {
            try
            {
                var accounts = await _tellerSyncService.GetTellerAccountsAsync(enrollmentId);
                return Ok(accounts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting Teller accounts for enrollment {EnrollmentId}", enrollmentId);
                return StatusCode(500, new { message = "Failed to get Teller accounts", error = ex.Message });
            }
        }

        /// <summary>
        /// Link a Teller account to a local account
        /// </summary>
        [HttpPost("accounts/{localAccountId}/link")]
        public async Task<ActionResult> LinkTellerAccount(
            int localAccountId,
            [FromBody] LinkTellerAccountRequest request)
        {
            try
            {
                var success = await _tellerSyncService.LinkTellerAccountToLocalAccountAsync(
                    localAccountId,
                    request.TellerAccountId,
                    request.EnrollmentId);

                if (!success)
                {
                    return NotFound("Local account not found");
                }

                return Ok(new { message = "Account linked successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error linking Teller account to local account {LocalAccountId}", localAccountId);
                return StatusCode(500, new { message = "Failed to link account", error = ex.Message });
            }
        }

        /// <summary>
        /// Sync transactions for a single account
        /// </summary>
        [HttpPost("sync/{accountId}")]
        public async Task<ActionResult<SyncResult>> SyncAccount(int accountId, [FromQuery] bool autoCategorize = true)
        {
            try
            {
                var result = await _tellerSyncService.SyncAccountAsync(accountId, autoCategorize);
                if (!result.Success)
                {
                    return BadRequest(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing account {AccountId}", accountId);
                return StatusCode(500, new { message = "Failed to sync account", error = ex.Message });
            }
        }

        /// <summary>
        /// Sync transactions for all linked accounts
        /// </summary>
        [HttpPost("sync-all")]
        public async Task<ActionResult<IEnumerable<SyncResult>>> SyncAllAccounts([FromQuery] bool autoCategorize = true)
        {
            try
            {
                var results = await _tellerSyncService.SyncAllAccountsAsync(autoCategorize);
                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing all accounts");
                return StatusCode(500, new { message = "Failed to sync accounts", error = ex.Message });
            }
        }

        /// <summary>
        /// Unlink an account from Teller (keeps account, removes sync)
        /// </summary>
        [HttpDelete("unlink/{accountId}")]
        public async Task<ActionResult> UnlinkAccount(int accountId)
        {
            try
            {
                var success = await _tellerSyncService.UnlinkAccountAsync(accountId);
                if (!success)
                {
                    return NotFound("Account not found");
                }
                return Ok(new { message = "Account unlinked successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unlinking account {AccountId}", accountId);
                return StatusCode(500, new { message = "Failed to unlink account", error = ex.Message });
            }
        }

        /// <summary>
        /// Get sync status for all enrollments and linked accounts
        /// </summary>
        [HttpGet("status")]
        public async Task<ActionResult<TellerStatusResponse>> GetStatus()
        {
            try
            {
                var status = await _tellerSyncService.GetStatusAsync();
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting Teller status");
                return StatusCode(500, new { message = "Failed to get status", error = ex.Message });
            }
        }
    }

    public class LinkTellerAccountRequest
    {
        public string TellerAccountId { get; set; } = string.Empty;
        public int EnrollmentId { get; set; }
    }
}
