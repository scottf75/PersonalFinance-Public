using PetaPoco;

namespace PersonalFinance.API.Models
{
    [TableName("budgetplan")]
    [PrimaryKey("id", AutoIncrement = true)]
    public class BudgetPlan
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Column("description")]
        public string? Description { get; set; }

        [Column("startdate")]
        public DateTime StartDate { get; set; }

        [Column("enddate")]
        public DateTime EndDate { get; set; }

        [Column("isactive")]
        public bool IsActive { get; set; } = true;

        [Column("createdat")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updatedat")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [Column("userid")]
        public int? UserId { get; set; }

        // Navigation properties (not stored in database)
        [Ignore]
        public List<BudgetPlanCategory>? Categories { get; set; }

        [Ignore]
        public List<BudgetPlanAccount>? Accounts { get; set; }

        // Summary fields for list views
        [ResultColumn]
        public int CategoryCount { get; set; }

        [ResultColumn]
        public int AccountCount { get; set; }

        [ResultColumn]
        public decimal TotalBudgeted { get; set; }
    }
}
