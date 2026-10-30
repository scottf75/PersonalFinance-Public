// Transaction.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using PetaPoco;
using ColumnAttribute = PetaPoco.ColumnAttribute;

namespace PersonalFinance.API.Models
{
    [TableName("transaction")]
    [PrimaryKey("id", AutoIncrement = true)]
    public class Transactional
    {
        [Key]
        [Column("id")]
        [JsonPropertyName("id")]
        public int ID { get; set; }

        [Required]
        [Column("transactiondate")]
        [JsonPropertyName("transactionDate")]
        public DateTime TransactionDate { get; set; }

        [Required]
        [Column("amount")]
        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [Required]
        [ForeignKey("Category")]
        [Column("categoryid")]
        [JsonPropertyName("categoryId")]
        public int CategoryID { get; set; }

        [Required]
        [ForeignKey("Account")]
        [Column("accountid")]
        [JsonPropertyName("accountId")]
        public int AccountID { get; set; }

        [Column("description")]
        [JsonPropertyName("description")]
        public string Description { get; set; }

        [Column("checknumber")]
        [JsonPropertyName("checkNumber")]
        public string? CheckNumber { get; set; }

        // Teller.io integration field for deduplication
        [Column("tellertransactionid")]
        [JsonPropertyName("tellerTransactionId")]
        public string? TellerTransactionId { get; set; }

        [Column("userid")]
        [JsonPropertyName("userId")]
        public int? UserId { get; set; }

        // Navigation properties - ignored by PetaPoco
        [PetaPoco.Ignore]
        public virtual Category? Category { get; set; }

        [PetaPoco.Ignore]
        public virtual Account? Account { get; set; }

        // Additional properties for display (populated from JOIN, not mapped to database table)
        [ResultColumn]
        [JsonPropertyName("categoryName")]
        public string? CategoryName { get; set; }

        [ResultColumn]
        [JsonPropertyName("accountName")]
        public string? AccountName { get; set; }
    }
}
