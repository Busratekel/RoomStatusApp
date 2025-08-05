using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using RoomStatusWebApp.Data;
using System;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;

public class DeleteOldMeetingsService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    public DeleteOldMeetingsService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.Now;
            var today18 = new DateTime(now.Year, now.Month, now.Day, 18, 0, 0);
            var delay = today18 > now ? (today18 - now) : (today18.AddDays(1) - now);
            await Task.Delay(delay, stoppingToken);

            try
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    var today = DateTime.Today;
                    var tomorrow = today.AddDays(1);
                    var meetingsToDelete = dbContext.Meetings.Where(m => m.StartTime >= today && m.StartTime < tomorrow).ToList();
                    if (meetingsToDelete.Any())
                    {
                        dbContext.Meetings.RemoveRange(meetingsToDelete);
                        await dbContext.SaveChangesAsync();
                        Console.WriteLine($"{meetingsToDelete.Count} toplantı silindi ({today:yyyy-MM-dd})");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Toplantı silme servisinde hata: {ex.Message}");
            }
        }
    }
} 