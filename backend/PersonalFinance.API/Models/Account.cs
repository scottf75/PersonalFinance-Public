using System.ComponentModel.DataAnnotations;
using PetaPoco;

namespace PersonalFinance.API.Models
{
    [TableName("account")]
    [PrimaryKey("id", AutoIncrement = true)]
    public class Account
    {
        [Column("id")]
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        [Column("name")]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        [Column("institution")]
        public string Institution { get; set; } = string.Empty;
        
        [Required]
        [Column("accounttype")]
        public AccountType AccountType { get; set; }
        
        [Required]
        [Column("balance")]
        public decimal Balance { get; set; }
        
        [Column("creditlimit")]
        public decimal? CreditLimit { get; set; }
        
        [Column("duedate")]
        public DateTime? DueDate { get; set; }
        
        [StringLength(50)]
        [Column("accountnumber")]
        public string? AccountNumber { get; set; }
        
        [StringLength(100)]
        [Column("investmenttype")]
        public string? InvestmentType { get; set; }
        
        [Column("performance")]
        public decimal? Performance { get; set; }
        
        [Column("createdat")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Column("updatedat")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        [Column("lastsyncdate")]
        public DateTime? LastSyncDate { get; set; }
        
        [Column("isactive")]
        public bool IsActive { get; set; } = true;

        [Column("userid")]
        public int? UserId { get; set; }

        // Teller.io integration fields
        [StringLength(100)]
        [Column("telleraccountid")]
        public string? TellerAccountId { get; set; }

        [Column("tellerenrollmentid")]
        public int? TellerEnrollmentId { get; set; }
    }

    public enum AccountType
    {
        Bank = 1,
        Credit = 2,
        Investment = 3
    }
}