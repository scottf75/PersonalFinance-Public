using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalFinance.API.Models;
using PersonalFinance.API.Services;

namespace PersonalFinance.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class BudgetController : ControllerBase
    {
        private readonly IBudgetService _budgetService;

        public BudgetController(IBudgetService budgetService)
        {
            _budgetService = budgetService;
        }

        [HttpGet]
        public IActionResult GetBudgetsByMonth([FromQuery] int year, [FromQuery] int month)
        {
            if (year < 1900 || year > 2100 || month < 1 || month > 12)
            {
                return BadRequest("Invalid year or month specified.");
            }

            var budgets = _budgetService.GetBudgetsByMonth(year, month);
            return Ok(budgets);
        }

        [HttpGet("summary")]
        public IActionResult GetMonthlySummary([FromQuery] int year, [FromQuery] int month)
        {
            if (year < 1900 || year > 2100 || month < 1 || month > 12)
            {
                return BadRequest("Invalid year or month specified.");
            }

            var summary = _budgetService.GetMonthlySummary(year, month);
            return Ok(summary);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var budget = _budgetService.GetBudgetById(id);
            if (budget == null)
            {
                return NotFound();
            }

            return Ok(budget);
        }

        [HttpPost]
        public IActionResult CreateOrUpdate(Budget budget)
        {
            if (budget == null)
            {
                return BadRequest("Budget cannot be null.");
            }

            if (budget.Year < 1900 || budget.Year > 2100 || budget.Month < 1 || budget.Month > 12)
            {
                return BadRequest("Invalid year or month specified.");
            }

            if (budget.BudgetAmount < 0)
            {
                return BadRequest("Budget amount cannot be negative.");
            }

            var result = _budgetService.CreateOrUpdateBudget(budget);
            return Ok(result);
        }

        [HttpPost("batch")]
        public IActionResult BatchSave([FromQuery] int year, [FromQuery] int month, [FromBody] List<Budget> budgets)
        {
            if (year < 1900 || year > 2100 || month < 1 || month > 12)
            {
                return BadRequest("Invalid year or month specified.");
            }

            if (budgets == null || !budgets.Any())
            {
                return BadRequest("Budgets list cannot be empty.");
            }

            _budgetService.SaveBudgets(year, month, budgets);
            return Ok();
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var success = _budgetService.DeleteBudget(id);
            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}
