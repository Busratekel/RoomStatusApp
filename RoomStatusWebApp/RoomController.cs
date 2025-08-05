using Microsoft.AspNetCore.Mvc;
using RoomStatusWebApp;
using Microsoft.Graph.Models;
using RoomStatusWebApp.Data;
using RoomStatusWebApp.Models;

[ApiController]
[Route("[controller]")]
public class RoomController : ControllerBase
{
    private readonly GraphService _graphService;
    private readonly ApplicationDbContext _dbContext;
    public RoomController(GraphService graphService, ApplicationDbContext dbContext)
    {
        _graphService = graphService;
        _dbContext = dbContext;
    }
    [HttpGet("events")]
    
    public async Task<IActionResult> GetRoomEvents(
        [FromQuery] string roomEmail,
        [FromQuery] DateTime? start,
        [FromQuery] DateTime? end)
    {
        if (string.IsNullOrEmpty(roomEmail))
            return BadRequest("roomEmail parametresi zorunludur.");

        // Frontend'den gelen start ve end parametrelerini kullan
        DateTime startDate = start ?? DateTime.Today;
        DateTime endDate = end ?? DateTime.Today.AddDays(7);

        // Debug için log ekleyelim
        Console.WriteLine($"API Request - RoomEmail: {roomEmail}, Start: {startDate}, End: {endDate}");

        try 
        {
            var events = await _graphService.GetRoomCalendarEventsAsync(roomEmail, startDate, endDate);
            Console.WriteLine($"API Response - Found {events?.Count ?? 0} events");
            return Ok(events);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"API Error: {ex.Message}");
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpPost("save-events")]
    public async Task<IActionResult> SaveRoomEventsToDb(
        [FromQuery] string roomEmail,
        [FromQuery] int roomId,
        [FromQuery] DateTime start,
        [FromQuery] DateTime end)
    {
        if (string.IsNullOrEmpty(roomEmail) || roomId <= 0)
            return BadRequest("roomEmail ve roomId parametreleri zorunludur.");

        var addedCount = await _graphService.SaveRoomCalendarEventsToDbAsync(roomEmail, start, end, roomId);
        return Ok(new { addedCount });
    }

    [HttpGet("rooms")]
    public IActionResult GetRooms()
    {
        var rooms = _dbContext.Rooms.Select(r => new {
            id = r.Id,
            name = r.Name,
            email = r.Email,
            location = r.Location,
            capacity = r.Capacity,
            isActive = r.IsActive
        }).ToList();
        return Ok(rooms);
    }
}