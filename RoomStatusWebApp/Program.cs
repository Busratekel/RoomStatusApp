using Microsoft.EntityFrameworkCore;
using RoomStatusWebApp.Data;
using Microsoft.OpenApi.Models;
using RoomStatusWebApp;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
});

builder.Services.AddScoped<GraphService>();

// Toplantı silme servisini ekle
builder.Services.AddHostedService<DeleteOldMeetingsService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Add Static Files middleware
app.UseStaticFiles();

// Add SPA fallback
app.MapFallbackToFile("index.html");

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.Run();