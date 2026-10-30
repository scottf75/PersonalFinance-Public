using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalFinance.API.Models;
using PersonalFinance.API.Services;

namespace PersonalFinance.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly IAccountService _accountService;

        public AccountController(IAccountService accountService)
        {
            _accountService = accountService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Account>>> GetAccounts()
        {
            try
            {
                var accounts = await _accountService.GetAllAccountsAsync();
                return Ok(accounts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving accounts.", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Account>> GetAccount(int id)
        {
            try
            {
                var account = await _accountService.GetAccountByIdAsync(id);
                
                if (account == null)
                {
                    return NotFound(new { message = $"Account with ID {id} not found." });
                }

                return Ok(account);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the account.", error = ex.Message });
            }
        }

        [HttpGet("type/{accountType}")]
        public async Task<ActionResult<IEnumerable<Account>>> GetAccountsByType(AccountType accountType)
        {
            try
            {
                var accounts = await _accountService.GetAccountsByTypeAsync(accountType);
                return Ok(accounts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving accounts by type.", error = ex.Message });
            }
        }

        [HttpGet("summary/balance/{accountType}")]
        public async Task<ActionResult<decimal>> GetTotalBalanceByType(AccountType accountType)
        {
            try
            {
                var totalBalance = await _accountService.GetTotalBalanceByTypeAsync(accountType);
                return Ok(new { accountType = accountType.ToString(), totalBalance });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while calculating total balance.", error = ex.Message });
            }
        }

        [HttpGet("summary/networth")]
        public async Task<ActionResult<decimal>> GetNetWorth()
        {
            try
            {
                var netWorth = await _accountService.GetNetWorthAsync();
                return Ok(new { netWorth });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while calculating net worth.", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<Account>> CreateAccount([FromBody] Account account)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var createdAccount = await _accountService.CreateAccountAsync(account);
                return CreatedAtAction(nameof(GetAccount), new { id = createdAccount.Id }, createdAccount);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the account.", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Account>> UpdateAccount(int id, [FromBody] Account account)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var updatedAccount = await _accountService.UpdateAccountAsync(id, account);
                
                if (updatedAccount == null)
                {
                    return NotFound(new { message = $"Account with ID {id} not found." });
                }

                return Ok(updatedAccount);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the account.", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteAccount(int id)
        {
            try
            {
                var result = await _accountService.DeleteAccountAsync(id);
                
                if (!result)
                {
                    return NotFound(new { message = $"Account with ID {id} not found." });
                }

                return Ok(new { message = $"Account with ID {id} has been deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the account.", error = ex.Message });
            }
        }
    }
}