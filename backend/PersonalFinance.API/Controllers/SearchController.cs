using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalFinance.API.Models;
using PersonalFinance.API.Services;

namespace PersonalFinance.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class SearchController : ControllerBase
    {
        private readonly ISearchParserService _searchParserService;
        private readonly ITransactionService _transactionService;

        public SearchController(
            ISearchParserService searchParserService,
            ITransactionService transactionService)
        {
            _searchParserService = searchParserService;
            _transactionService = transactionService;
        }

        /// <summary>
        /// Parse a natural language search query into structured filters
        /// </summary>
        [HttpPost("parse")]
        public async Task<ActionResult<SearchParseResponse>> ParseQuery([FromBody] SearchParseRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Query))
            {
                return BadRequest("Query is required");
            }

            var response = await _searchParserService.ParseQueryAsync(request.Query, request.AccountId);
            return Ok(response);
        }

        /// <summary>
        /// Parse a natural language query and return matching transactions
        /// </summary>
        [HttpPost("transactions")]
        public async Task<ActionResult<IEnumerable<Transactional>>> SearchTransactions([FromBody] SearchParseRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Query))
            {
                return BadRequest("Query is required");
            }

            var parseResponse = await _searchParserService.ParseQueryAsync(request.Query, request.AccountId);
            var transactions = await _transactionService.GetTransactionsByFiltersAsync(parseResponse.Filters);

            return Ok(new
            {
                filters = parseResponse.Filters,
                explanation = parseResponse.Explanation,
                transactions = transactions
            });
        }
    }
}
