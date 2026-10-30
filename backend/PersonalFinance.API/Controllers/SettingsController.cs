using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalFinance.API.Models;
using PersonalFinance.API.Services;

namespace PersonalFinance.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class SettingsController : ControllerBase
    {
        private readonly ISettingsService _settingsService;

        public SettingsController(ISettingsService settingsService)
        {
            _settingsService = settingsService;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            var settings = _settingsService.GetAllSettings();
            return Ok(settings);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var setting = _settingsService.GetSettingById(id);
            if (setting == null)
            {
                return NotFound();
            }
            return Ok(setting);
        }

        [HttpGet("name/{name}")]
        public IActionResult GetByName(string name)
        {
            var setting = _settingsService.GetSettingByName(name);
            if (setting == null)
            {
                return NotFound();
            }
            return Ok(setting);
        }

        [HttpPost]
        public IActionResult Add(Setting setting)
        {
            try
            {
                var createdSetting = _settingsService.AddSetting(setting);
                return CreatedAtAction(nameof(GetById), new { id = createdSetting.Id }, createdSetting);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, Setting setting)
        {
            if (id != setting.Id)
            {
                return BadRequest("Setting ID mismatch.");
            }

            try
            {
                var updatedSetting = _settingsService.UpdateSetting(setting);
                if (updatedSetting == null)
                {
                    return NotFound();
                }
                return Ok(updatedSetting);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var success = _settingsService.DeleteSetting(id);
            if (!success)
            {
                return NotFound();
            }
            return NoContent();
        }
    }
}
