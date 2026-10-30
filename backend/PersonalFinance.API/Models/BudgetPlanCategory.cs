using PetaPoco;

namespace PersonalFinance.API.Models
{
    [TableName("budgetplancategory")]
    [PrimaryKey("id", AutoIncrement = true)]
    public class BudgetPlanCategory
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("budgetplanid")]
        public int BudgetPlanId { get; set; }

        [Column("categoryid")]
        public int CategoryId { get; set; }

        [Column("budgetamount")]
        public decimal BudgetAmount { get; set; }

        [Column("createdat")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updatedat")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Result columns from JOIN queries
        [ResultColumn]
        public string? CategoryName { get; set; }

        [ResultColumn]
        public string? CategoryIcon { get; set; }

        [ResultColumn]
        public int? CategoryType { get; set; }
    }
}
