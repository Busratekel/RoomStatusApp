using System.ComponentModel.DataAnnotations;

namespace RoomStatusWebApp.Models
{
    public class Room
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string Name { get; set; }
        
        [Required]
        public string Email { get; set; }
        
        public string Location { get; set; }
        
        public int Capacity { get; set; }
        
        public bool IsActive { get; set; }
        
        public virtual ICollection<Meeting> Meetings { get; set; }
    }
} 