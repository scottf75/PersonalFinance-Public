using PetaPoco;

namespace PersonalFinance.API.Models
{
    [TableName("budgetplanaccount")]
    [PrimaryKey("id", AutoIncrement = true)]
    public class BudgetPlanAccount
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("budgetplanid")]
        public int BudgetPlanId { get; set; }

        [Column("accountid")]
        public int AccountId { get; set; }

        [Column("createdat")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Result columns from JOIN queries
        [ResultColumn]
        public string? AccountName { get; set; }

        [ResultColumn]
        public string? Institution { get; set; }

        [ResultColumn]
        public int? AccountType { get; set; }
    }
}
