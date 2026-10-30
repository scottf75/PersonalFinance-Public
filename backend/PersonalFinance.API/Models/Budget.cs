using PetaPoco;

namespace PersonalFinance.API.Models
{
    [TableName("budget")]
    [PrimaryKey("id", AutoIncrement = true)]
    public class Budget
    {
        [Column("id")]
        public int ID { get; set; }

        [Column("year")]
        public int Year { get; set; }

        [Column("month")]
        public int Month { get; set; }

        [Column("categoryid")]
        public int CategoryId { get; set; }

        [Column("budgetamount")]
        public decimal BudgetAmount { get; set; }

        [Column("userid")]
        public int? UserId { get; set; }
    }
}
