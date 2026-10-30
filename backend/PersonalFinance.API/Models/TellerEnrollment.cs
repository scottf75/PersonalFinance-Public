using System.ComponentModel.DataAnnotations;
using PetaPoco;

namespace PersonalFinance.API.Models
{
    [TableName("tellerenrollment")]
    [PrimaryKey("id", AutoIncrement = true)]
    public class TellerEnrollment
    {
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        [Column("enrollmentid")]
        public string EnrollmentId { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        [Column("accesstoken")]
        public string AccessToken { get; set; } = string.Empty;

        [StringLength(100)]
        [Column("institutionname")]
        public string? InstitutionName { get; set; }

        [Column("lastsyncat")]
        public DateTime? LastSyncAt { get; set; }

        [Column("createdat")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("isactive")]
        public bool IsActive { get; set; } = true;

        [Column("userid")]
        public int? UserId { get; set; }
    }
}
