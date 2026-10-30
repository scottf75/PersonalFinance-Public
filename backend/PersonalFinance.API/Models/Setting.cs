using PetaPoco;
using System.Text.Json.Serialization;

namespace PersonalFinance.API.Models
{
    [TableName("setting")]
    [PrimaryKey("id", AutoIncrement = true)]
    public class Setting
    {
        [Column("id")]
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [Column("name")]
        [JsonPropertyName("name")]
        public string Name { get; set; }

        [Column("value")]
        [JsonPropertyName("value")]
        public string? Value { get; set; }

        [Column("createdat")]
        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }

        [Column("updatedat")]
        [JsonPropertyName("updatedAt")]
        public DateTime UpdatedAt { get; set; }

        [Column("userid")]
        [JsonPropertyName("userId")]
        public int? UserId { get; set; }
    }
}
