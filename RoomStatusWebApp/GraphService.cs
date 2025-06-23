using Microsoft.Graph;
using Microsoft.Graph.Models;
using Azure.Identity;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using RoomStatusWebApp.Data;
using RoomStatusWebApp.Models;

namespace RoomStatusWebApp
{
    public class GraphService
    {
        private readonly IConfiguration _configuration;
        private GraphServiceClient _graphClient;
        private readonly ApplicationDbContext _dbContext;

        public GraphService(IConfiguration configuration, ApplicationDbContext dbContext)
        {
            _configuration = configuration;
            _dbContext = dbContext;
            InitializeGraphClient();
        }

        private void InitializeGraphClient()
        {
            var tenantId = _configuration["AzureAd:TenantId"];
            var clientId = _configuration["AzureAd:ClientId"];
            var clientSecret = _configuration["AzureAd:ClientSecret"];

            var options = new TokenCredentialOptions
            {
                AuthorityHost = AzureAuthorityHosts.AzurePublicCloud
            };
            var clientSecretCredential = new ClientSecretCredential(
                tenantId, clientId, clientSecret, options);

            _graphClient = new GraphServiceClient(clientSecretCredential);
        }

        public async Task<ICollection<Event>> GetRoomCalendarEventsAsync(string roomEmail, DateTime start, DateTime end)
        {
            var events = await _graphClient.Users[roomEmail].CalendarView
                .GetAsync(requestConfig =>
                {
                    requestConfig.QueryParameters.StartDateTime = start.ToString("o");
                    requestConfig.QueryParameters.EndDateTime = end.ToString("o");
                    requestConfig.Headers.Add("Prefer", "outlook.timezone=\"Turkey Standard Time\"");
                });

            return events != null && events.Value != null ? events.Value : new List<Event>();
        }

        public async Task<int> SaveRoomCalendarEventsToDbAsync(string roomEmail, DateTime start, DateTime end, int roomId)
        {
            var events = await GetRoomCalendarEventsAsync(roomEmail, start, end);
            int addedCount = 0;
            foreach (var ev in events)
            {
                // Aynı toplantı zaten var mı kontrol et
                bool exists = _dbContext.Meetings.Any(m => m.Subject == ev.Subject && m.StartTime == DateTime.Parse(ev.Start.DateTime) && m.RoomId == roomId);
                if (!exists)
                {
                    var meeting = new Meeting
                    {
                        Subject = ev.Subject,
                        StartTime = DateTime.Parse(ev.Start.DateTime),
                        EndTime = DateTime.Parse(ev.End.DateTime),
                        Organizer = ev.Organizer?.EmailAddress?.Name,
                        Attendees = string.Join(", ", ev.Attendees?.Select(a => a.EmailAddress?.Address)),
                        RoomId = roomId
                    };
                    _dbContext.Meetings.Add(meeting);
                    addedCount++;
                }
            }
            await _dbContext.SaveChangesAsync();
            return addedCount;
        }
    }
} 