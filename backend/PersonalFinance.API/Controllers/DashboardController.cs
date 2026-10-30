using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalFinance.API.Models;
using PersonalFinance.API.Services;

namespace PersonalFinance.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("summary")]
        public async Task<ActionResult<DashboardSummary>> GetSummary([FromQuery] int? year = null, [FromQuery] int? month = null)
        {
            try
            {
                DateTime? targetMonth = null;
                if (year.HasValue && month.HasValue)
                {
                    targetMonth = new DateTime(year.Value, month.Value, 1);
                }

                var summary = await _dashboardService.GetDashboardSummaryAsync(targetMonth);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving dashboard summary.", error = ex.Message });
            }
        }
    }
}
