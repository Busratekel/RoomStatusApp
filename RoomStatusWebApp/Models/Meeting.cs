using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RoomStatusWebApp.Models
{
    public class Meeting
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string Subject { get; set; }
        
        [Required]
        public DateTime StartTime { get; set; }
        
        [Required]
        public DateTime EndTime { get; set; }
        
        public string Organizer { get; set; }
        
        public string Attendees { get; set; }
        
        [Required]
        public int RoomId { get; set; }
        
        [ForeignKey("RoomId")]
        public virtual Room Room { get; set; }
    }
} 