using Microsoft.EntityFrameworkCore;
using RoomStatusWebApp.Models;

namespace RoomStatusWebApp.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Room> Rooms { get; set; }
        public DbSet<Meeting> Meetings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Seed some initial room data
            modelBuilder.Entity<Room>().HasData(
                new Room { Id = 1, Name = "Toplantı Odası 1", Email = "toplanti1@company.com", Location = "1. Kat", Capacity = 10, IsActive = true },
                new Room { Id = 2, Name = "Toplantı Odası 2", Email = "toplanti2@company.com", Location = "2. Kat", Capacity = 8, IsActive = false },
                new Room { Id = 3, Name = "Toplantı Odası 3", Email = "toplanti3@company.com", Location = "3. Kat", Capacity = 15, IsActive = false }
            );
        }
    }
} 