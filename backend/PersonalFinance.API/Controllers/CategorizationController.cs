using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalFinance.API.Models;
using PersonalFinance.API.Services;

namespace PersonalFinance.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CategorizationController : ControllerBase
    {
        private readonly ICategorizationService _categorizationService;

        public CategorizationController(ICategorizationService categorizationService)
        {
            _categorizationService = categorizationService;
        }

        [HttpPost("suggest")]
        public async Task<ActionResult<CategorizationResponse>> SuggestCategory([FromBody] CategorizationRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Description))
            {
                return BadRequest("Description is required.");
            }

            if (request.Description.Length < 3)
            {
                return BadRequest("Description must be at least 3 characters.");
            }

            var response = await _categorizationService.SuggestCategoryAsync(request.Description);
            return Ok(response);
        }

        /// <summary>
        /// Categorize all uncategorized transactions using AI
        /// </summary>
        [HttpPost("batch")]
        public async Task<ActionResult<BatchCategorizationResult>> CategorizeUncategorized([FromQuery] int? accountId = null)
        {
            var result = await _categorizationService.CategorizeUncategorizedTransactionsAsync(accountId);
            return Ok(result);
        }
    }
}
