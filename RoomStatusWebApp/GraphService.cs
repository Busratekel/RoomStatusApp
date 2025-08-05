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
        public readonly IConfiguration _configuration;
        public GraphServiceClient _graphClient;
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

            Console.WriteLine($"DEBUG - TenantId: {tenantId}");
            Console.WriteLine($"DEBUG - ClientId: {clientId}");
            Console.WriteLine($"DEBUG - ClientSecret: {(string.IsNullOrEmpty(clientSecret) ? "EMPTY" : "SET")}");

            if (string.IsNullOrEmpty(tenantId) || string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
            {
                throw new InvalidOperationException("Azure AD configuration is missing. Please check appsettings.json");
            }

            var options = new TokenCredentialOptions
            {
                AuthorityHost = AzureAuthorityHosts.AzurePublicCloud
            };
            var clientSecretCredential = new ClientSecretCredential(
                tenantId, clientId, clientSecret, options);

            _graphClient = new GraphServiceClient(clientSecretCredential);
            
            Console.WriteLine("DEBUG - Graph client initialized successfully");
        }

        public async Task<ICollection<Event>> GetRoomCalendarEventsAsync(string roomEmail, DateTime start, DateTime end)
        {
            try
            {
                Console.WriteLine($"DEBUG - Attempting to get calendar events for: {roomEmail}");
                Console.WriteLine($"DEBUG - Start: {start}, End: {end}");
                
                // Kullanıcı kontrolü geçici olarak kaldırıldı
                Console.WriteLine($"DEBUG - Skipping user validation for: {roomEmail}");
                
                var events = await _graphClient.Users[roomEmail].CalendarView
                    .GetAsync(requestConfig =>
                    {
                        requestConfig.QueryParameters.StartDateTime = start.ToString("o");
                        requestConfig.QueryParameters.EndDateTime = end.ToString("o");
                        requestConfig.QueryParameters.Select = new string[] { "subject", "start", "end", "organizer", "attendees", "body", "location" };
                        requestConfig.Headers.Add("Prefer", "outlook.timezone=\"Turkey Standard Time\"");
                    });

                Console.WriteLine($"DEBUG - Successfully retrieved {events?.Value?.Count ?? 0} events");

                // Debug: Graph API'den gelen veriyi logla
                if (events?.Value != null)
                {
                                         foreach (var ev in events.Value)
                     {
                         Console.WriteLine($"DEBUG - Event Subject: '{ev.Subject}'");
                         Console.WriteLine($"DEBUG - Event Organizer: '{ev.Organizer?.EmailAddress?.Name}'");
                         Console.WriteLine($"DEBUG - Event Body: '{ev.Body?.Content?.Substring(0, Math.Min(200, ev.Body.Content?.Length ?? 0))}'");
                         Console.WriteLine($"DEBUG - Event Location: '{ev.Location?.DisplayName}'");
                         Console.WriteLine($"DEBUG - Event Start: '{ev.Start?.DateTime}'");
                         Console.WriteLine($"DEBUG - Event End: '{ev.End?.DateTime}'");

                         Console.WriteLine("---");
                     }
                }

                return events != null && events.Value != null ? events.Value : new List<Event>();
            }
            catch (Microsoft.Graph.Models.ODataErrors.ODataError odataError)
            {
                Console.WriteLine($"DEBUG - ODataError: {odataError.Error?.Message ?? odataError.Message}");
                Console.WriteLine($"DEBUG - Error Code: {odataError.Error?.Code}");
                if (odataError.Error?.Details != null)
                {
                    foreach (var detail in odataError.Error.Details)
                    {
                        Console.WriteLine($"DEBUG - Error Detail: {detail.Message}");
                    }
                }
                throw;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"DEBUG - Graph API Error: {ex.Message}");
                Console.WriteLine($"DEBUG - Error Type: {ex.GetType().Name}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"DEBUG - Inner Exception: {ex.InnerException.Message}");
                }
                throw;
            }
        }

        private string GetMeetingSubject(Event ev)
        {
            // Body içeriğinden konu çıkarmaya çalış
            if (!string.IsNullOrEmpty(ev.Body?.Content))
            {
                var bodyContent = ev.Body.Content;
                
                // HTML tag'lerini temizle
                bodyContent = System.Text.RegularExpressions.Regex.Replace(bodyContent, "<[^>]*>", "");
                
                // "Konu:" veya "Subject:" ile başlayan satırları ara
                var lines = bodyContent.Split('\n');
                foreach (var line in lines)
                {
                    var trimmedLine = line.Trim();
                    if (trimmedLine.StartsWith("Konu:", StringComparison.OrdinalIgnoreCase) ||
                        trimmedLine.StartsWith("Subject:", StringComparison.OrdinalIgnoreCase))
                    {
                        var topic = trimmedLine.Substring(trimmedLine.IndexOf(':') + 1).Trim();
                        if (!string.IsNullOrEmpty(topic))
                        {
                            return topic;
                        }
                    }
                }
                
                // Body'nin ilk 100 karakterini kontrol et
                if (bodyContent.Length > 20)
                {
                    var firstPart = bodyContent.Substring(0, Math.Min(100, bodyContent.Length));
                    if (!firstPart.Contains("html") && !firstPart.Contains("DOCTYPE"))
                    {
                        return firstPart.Trim();
                    }
                }
            }
            
            // Subject boşsa veya sadece kişi ismi ise, daha açıklayıcı bir konu oluştur
            if (string.IsNullOrEmpty(ev.Subject))
            {
                return ev.Organizer?.EmailAddress?.Name != null ? $"{ev.Organizer.EmailAddress.Name} Toplantısı" : "Toplantı";
            }
            
            // Subject sadece kişi ismi gibi görünüyorsa (büyük harflerle yazılmışsa)
            if (ev.Subject == ev.Subject.ToUpper() && ev.Subject.Length < 50)
            {
                return $"{ev.Subject} Toplantısı";
            }
            
            return ev.Subject;
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
                        Subject = GetMeetingSubject(ev),
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