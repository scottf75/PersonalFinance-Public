using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalFinance.API.Models;
using PersonalFinance.API.Services;

namespace PersonalFinance.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class BudgetPlanController : ControllerBase
    {
        private readonly IBudgetPlanService _budgetPlanService;

        public BudgetPlanController(IBudgetPlanService budgetPlanService)
        {
            _budgetPlanService = budgetPlanService;
        }

        #region Budget Plan CRUD

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var plans = await _budgetPlanService.GetAllBudgetPlansAsync();
            return Ok(plans);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var plan = await _budgetPlanService.GetBudgetPlanByIdAsync(id);
            if (plan == null)
            {
                return NotFound();
            }
            return Ok(plan);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] BudgetPlan plan)
        {
            if (plan == null)
            {
                return BadRequest("Budget plan cannot be null.");
            }

            if (string.IsNullOrWhiteSpace(plan.Name))
            {
                return BadRequest("Budget plan name is required.");
            }

            if (plan.EndDate < plan.StartDate)
            {
                return BadRequest("End date must be after start date.");
            }

            var result = await _budgetPlanService.CreateBudgetPlanAsync(plan);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] BudgetPlan plan)
        {
            if (plan == null)
            {
                return BadRequest("Budget plan cannot be null.");
            }

            if (string.IsNullOrWhiteSpace(plan.Name))
            {
                return BadRequest("Budget plan name is required.");
            }

            if (plan.EndDate < plan.StartDate)
            {
                return BadRequest("End date must be after start date.");
            }

            try
            {
                var result = await _budgetPlanService.UpdateBudgetPlanAsync(id, plan);
                return Ok(result);
            }
            catch (InvalidOperationException)
            {
                return NotFound();
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _budgetPlanService.DeleteBudgetPlanAsync(id);
            if (!success)
            {
                return NotFound();
            }
            return NoContent();
        }

        #endregion

        #region Category Management

        [HttpGet("{id}/categories")]
        public async Task<IActionResult> GetCategories(int id)
        {
            var categories = await _budgetPlanService.GetBudgetPlanCategoriesAsync(id);
            return Ok(categories);
        }

        [HttpPost("{id}/categories")]
        public async Task<IActionResult> AddCategory(int id, [FromBody] AddCategoryRequest request)
        {
            if (request == null)
            {
                return BadRequest("Request cannot be null.");
            }

            if (request.BudgetAmount < 0)
            {
                return BadRequest("Budget amount cannot be negative.");
            }

            try
            {
                var result = await _budgetPlanService.AddCategoryToPlanAsync(id, request.CategoryId, request.BudgetAmount);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}/categories/{categoryId}")]
        public async Task<IActionResult> UpdateCategory(int id, int categoryId, [FromBody] UpdateCategoryRequest request)
        {
            if (request == null)
            {
                return BadRequest("Request cannot be null.");
            }

            if (request.BudgetAmount < 0)
            {
                return BadRequest("Budget amount cannot be negative.");
            }

            try
            {
                var result = await _budgetPlanService.UpdatePlanCategoryAsync(id, categoryId, request.BudgetAmount);
                return Ok(result);
            }
            catch (InvalidOperationException)
            {
                return NotFound();
            }
        }

        [HttpDelete("{id}/categories/{categoryId}")]
        public async Task<IActionResult> RemoveCategory(int id, int categoryId)
        {
            var success = await _budgetPlanService.RemoveCategoryFromPlanAsync(id, categoryId);
            if (!success)
            {
                return NotFound();
            }
            return NoContent();
        }

        [HttpPost("{id}/categories/batch")]
        public async Task<IActionResult> BatchUpdateCategories(int id, [FromBody] List<BudgetPlanCategory> categories)
        {
            if (categories == null)
            {
                return BadRequest("Categories list cannot be null.");
            }

            await _budgetPlanService.BatchUpdateCategoriesAsync(id, categories);
            return Ok();
        }

        #endregion

        #region Account Management

        [HttpGet("{id}/accounts")]
        public async Task<IActionResult> GetAccounts(int id)
        {
            var accounts = await _budgetPlanService.GetBudgetPlanAccountsAsync(id);
            return Ok(accounts);
        }

        [HttpPost("{id}/accounts")]
        public async Task<IActionResult> SetAccounts(int id, [FromBody] SetAccountsRequest request)
        {
            if (request == null || request.AccountIds == null)
            {
                return BadRequest("Account IDs cannot be null.");
            }

            await _budgetPlanService.SetPlanAccountsAsync(id, request.AccountIds);
            return Ok();
        }

        #endregion

        #region Reporting

        [HttpGet("{id}/report")]
        public async Task<IActionResult> GetReport(int id, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var report = await _budgetPlanService.GetBudgetPlanReportAsync(id, startDate, endDate);
                return Ok(report);
            }
            catch (InvalidOperationException)
            {
                return NotFound();
            }
        }

        [HttpGet("{id}/categories/{categoryId}/transactions")]
        public async Task<IActionResult> GetCategoryTransactions(int id, int categoryId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var transactions = await _budgetPlanService.GetCategoryTransactionsAsync(id, categoryId, startDate, endDate);
                return Ok(transactions);
            }
            catch (InvalidOperationException)
            {
                return NotFound();
            }
        }

        #endregion
    }

    #region Request DTOs

    public class AddCategoryRequest
    {
        public int CategoryId { get; set; }
        public decimal BudgetAmount { get; set; }
    }

    public class UpdateCategoryRequest
    {
        public decimal BudgetAmount { get; set; }
    }

    public class SetAccountsRequest
    {
        public List<int> AccountIds { get; set; } = new();
    }

    #endregion
}
