using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalFinance.API.Models;
using PersonalFinance.API.Services;

namespace PersonalFinance.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportsService _reportsService;

        public ReportsController(IReportsService reportsService)
        {
            _reportsService = reportsService;
        }

        [HttpGet("summary")]
        public async Task<ActionResult<ReportsSummary>> GetSummary(
            [FromQuery] int months = 12,
            [FromQuery] int? categoryMonth = null,
            [FromQuery] int? categoryYear = null)
        {
            try
            {
                // Validate months parameter
                if (months < 1 || months > 60)
                {
                    return BadRequest("Months parameter must be between 1 and 60.");
                }

                var summary = await _reportsService.GetReportsSummaryAsync(months, categoryMonth, categoryYear);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving reports summary.", error = ex.Message });
            }
        }
    }
}
