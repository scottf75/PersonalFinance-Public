// TransactionController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalFinance.API.Models;
using PersonalFinance.API.Services;

namespace PersonalFinance.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")] // Base route for the controller
    public class TransactionController : ControllerBase
    {
        private readonly ITransactionService _transactionService;

        public TransactionController(ITransactionService transactionService)
        {
            _transactionService = transactionService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Transactional>>> GetTransactions([FromQuery] int? accountId = null)
        {
            try
            {
                IEnumerable<Transactional> transactionals;

                if (accountId.HasValue)
                {
                    transactionals = await _transactionService.GetTransactionsByAccountIdAsync(accountId.Value);
                }
                else
                {
                    transactionals = await _transactionService.GetAllTransactionsAsync();
                }

                return Ok(transactionals);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving transactions.", error = ex.Message });
            }
        }

        [HttpGet("filter")]
        public async Task<ActionResult<IEnumerable<Transactional>>> GetFilteredTransactions(
            [FromQuery] int? accountId = null,
            [FromQuery] string? keywords = null,
            [FromQuery] int[]? categoryIds = null,
            [FromQuery] decimal? minAmount = null,
            [FromQuery] decimal? maxAmount = null,
            [FromQuery] DateTime? dateFrom = null,
            [FromQuery] DateTime? dateTo = null)
        {
            try
            {
                var filters = new SearchFilters
                {
                    AccountId = accountId,
                    Keywords = keywords,
                    CategoryIds = categoryIds,
                    MinAmount = minAmount,
                    MaxAmount = maxAmount,
                    DateFrom = dateFrom,
                    DateTo = dateTo
                };

                var transactions = await _transactionService.GetTransactionsByFiltersAsync(filters);
                return Ok(transactions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving transactions.", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<Transactional>> CreateTransaction([FromBody] Transactional transaction)
        {
            try
            {
                if (transaction == null)
                {
                    return BadRequest("Transaction data is required.");
                }

                if (transaction.AccountID <= 0)
                {
                    return BadRequest("Valid AccountID is required.");
                }

                if (transaction.CategoryID <= 0)
                {
                    return BadRequest("Valid CategoryID is required.");
                }

                if (transaction.Amount == 0)
                {
                    return BadRequest("Transaction amount cannot be zero.");
                }

                var createdTransaction = await _transactionService.CreateTransactionAsync(transaction);
                return CreatedAtAction(nameof(GetTransactions), new { id = createdTransaction.ID }, createdTransaction);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the transaction.", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Transactional>> UpdateTransaction(int id, [FromBody] Transactional transaction)
        {
            try
            {
                if (transaction == null)
                {
                    return BadRequest("Transaction data is required.");
                }

                if (id != transaction.ID)
                {
                    return BadRequest("Transaction ID mismatch.");
                }

                if (transaction.AccountID <= 0)
                {
                    return BadRequest("Valid AccountID is required.");
                }

                if (transaction.CategoryID <= 0)
                {
                    return BadRequest("Valid CategoryID is required.");
                }

                var updatedTransaction = await _transactionService.UpdateTransactionAsync(transaction);
                if (updatedTransaction == null)
                {
                    return NotFound($"Transaction with ID {id} not found.");
                }

                return Ok(updatedTransaction);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the transaction.", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteTransaction(int id)
        {
            try
            {
                var success = await _transactionService.DeleteTransactionAsync(id);
                if (!success)
                {
                    return NotFound($"Transaction with ID {id} not found.");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the transaction.", error = ex.Message });
            }
        }
    }
}