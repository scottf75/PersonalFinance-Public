using PetaPoco;

namespace PersonalFinance.API.Models
{
    [TableName("category")]
    [PrimaryKey("id", AutoIncrement = true)]
    public class Category
    {
        [Column("id")]
        public int ID { get; set; }

        [Column("name")]
        public string Name { get; set; }

        [Column("description")]
        public string? Description { get; set; }

        [Column("icon")]
        public string? Icon { get; set; }

        [Column("isactive")]
        public bool IsActive { get; set; } = true;

        [Column("categorytype")]
        public CategoryType CategoryType { get; set; } = CategoryType.Expense;

        [Column("userid")]
        public int? UserId { get; set; }
    }

    public enum CategoryType
    {
        Income = 1,
        Expense = 2
    }
}