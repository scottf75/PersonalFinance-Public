using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalFinance.API.Models;
using PersonalFinance.API.Services;

namespace PersonalFinance.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CategoryController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoryController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [HttpPost]
        public IActionResult Add(Category category)
        {
            var createdCategory = _categoryService.AddCategory(category);
            return CreatedAtAction(nameof(GetById), new { id = createdCategory.ID }, createdCategory);
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, Category category)
        {
            if (id != category.ID)
            {
                return BadRequest("Category ID mismatch.");
            }

            var updatedCategory = _categoryService.UpdateCategory(category);
            if (updatedCategory == null)
            {
                return NotFound();
            }

            return Ok(updatedCategory);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var category = _categoryService.GetCategoryById(id);
            if (category == null)
            {
                return NotFound();
            }

            return Ok(category);
        }

        [HttpGet (Name = "GetCategories")]
        public IActionResult GetAll()
        {
            var categories = _categoryService.GetAllCategories();
            return Ok(categories);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var success = _categoryService.DeleteCategory(id);
            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpPost("{id}/toggle-active")]
        public async Task<IActionResult> ToggleActive(int id)
        {
            var category = await _categoryService.ToggleCategoryActiveAsync(id);
            if (category == null)
            {
                return NotFound();
            }

            return Ok(category);
        }
    }


}
