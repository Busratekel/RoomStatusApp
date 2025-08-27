import React from "react";
import config from "./config.json";
import "./RoomStatus.css";

function RoomStatus() {
  var roomEmail = config.roomEmail;
  var roomName = config.roomName;
  var events = React.useState([]);
  var setEvents = events[1];
  events = events[0];

  // Microsoft Graph API verilerini frontend formatına dönüştür
  var transformEvents = function(graphEvents) {
    if (!Array.isArray(graphEvents)) return [];
    
    var transformed = graphEvents.map(function(event) {
      var startDate = event.start && event.start.dateTime;
      var endDate = event.end && event.end.dateTime;
      var dateStr = startDate ? new Date(startDate).toISOString().slice(0, 10) : null;
      
      var organizer = "Bilinmeyen";
      if (event.organizer && event.organizer.emailAddress && event.organizer.emailAddress.name) {
        organizer = event.organizer.emailAddress.name;
      }
      
      var attendees = [];
      if (event.attendees && Array.isArray(event.attendees)) {
        attendees = event.attendees.map(function(a) {
          return a.emailAddress && a.emailAddress.name ? a.emailAddress.name : null;
        }).filter(function(name) {
          return name !== null;
        });
      }
      
      var transformedEvent = {
        id: event.id,
        subject: event.subject || "Toplantı",
        start: startDate,
        end: endDate,
        date: dateStr,
        organizer: organizer,
        attendees: attendees
      };
      return transformedEvent;
    });
    
    // Başlangıç saatine göre sırala
    var sorted = transformed.sort(function(a, b) {
      if (!a.start || !b.start) return 0;
      return new Date(a.start) - new Date(b.start);
    });
    
    return sorted;
  };

  // Toplantı verilerini her 5 dakikada bir çek
  React.useEffect(function() {
    function fetchEvents() {
      // 2025 Ağustos ayındaki toplantıları al
      var start = new Date(2025, 7, 20, 21, 0, 0); // 20 Ağustos 2025 21:00
      var end = new Date(2025, 8, 4, 20, 59, 59);  // 4 Eylül 2025 20:59

      var apiUrl = "/room/events?roomEmail=" + encodeURIComponent(roomEmail) + "&start=" + start.toISOString() + "&end=" + end.toISOString();
      
      // Fetch API yerine XMLHttpRequest kullan (eski cihazlar için)
      var xhr = new XMLHttpRequest();
      xhr.open("GET", apiUrl, true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              var data = JSON.parse(xhr.responseText);
              var eventsArray = Array.isArray(data) ? data : (Array.isArray(data.events) ? data.events : []);
              var transformedEvents = transformEvents(eventsArray);
              setEvents(transformedEvents);
            } catch (error) {
              console.error("JSON parse hatası:", error);
              setEvents([]);
            }
          } else {
            console.error("Veri çekme hatası:", xhr.status);
            setEvents([]);
          }
        }
      };
      xhr.onerror = function() {
        console.error("Network hatası");
        setEvents([]);
      };
      xhr.send();
    }

    fetchEvents(); // ilk açılışta hemen çek
    var interval = setInterval(fetchEvents, 5 * 60 * 1000); // her 5 dakikada bir çek

    return function() {
      clearInterval(interval); // component kapanınca timer'ı temizle
    };
  }, [roomEmail]);

  // Test için 2025 Ağustos ayındaki toplantıları göster
  var today = new Date(2025, 7, 21); // 21 Ağustos 2025
  var todayStr = today.toISOString().slice(0, 10);
  var now = today.getTime();
  var eighteen = new Date(2025, 7, 21, 18, 0, 0).getTime();
  
  // Şimdilik tüm toplantıları göster
  var todaysEvents = events.filter(function(e) {
    return e.date === todayStr;
  });
  var futureEvents = events.filter(function(e) {
    return e.date !== todayStr;
  });
  

  // Satır rengi belirleme fonksiyonu
  function getRowClass(event) {
    if (!event.start || !event.end) return "";
    var start = new Date(event.start.replace('T', ' ')).getTime();
    var end = new Date(event.end.replace('T', ' ')).getTime();
    if (now > end) return "row-finished"; // yeşil
    if (now >= start && now <= end) return "row-busy"; // kırmızı
    return "";
  }

  // Tarih formatı fonksiyonu
  var formatDate = function(dateStr) {
    var date = new Date(dateStr);
    var options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('tr-TR', options);
  };

  // Zaman formatı fonksiyonu
  var formatTime = function(dateStr) {
    if (!dateStr) return "-";
    var date = new Date(dateStr.replace('T', ' '));
    var hours = date.getHours();
    var minutes = date.getMinutes();
    return (hours < 10 ? '0' : '') + hours + ':' + (minutes < 10 ? '0' : '') + minutes;
  };

  return (
    <div>
      <h2>{roomName}</h2>
      <h3>Bugünkü Toplantılar</h3>
      <table className="meeting-table">
        <thead>
          <tr>
            <th>Tarih</th>
            <th>Başlangıç</th>
            <th>Bitiş</th>
            <th>Konu</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          {!todaysEvents || todaysEvents.length === 0 ? (
            <tr>
              <td colSpan="5">Bugün için toplantı yok</td>
            </tr>
          ) : (
            todaysEvents.map(function(event) {
              return (
                <tr key={event.id} className={getRowClass(event)}>
                  <td>{formatDate(event.date)}</td>
                  <td>{formatTime(event.start)}</td>
                  <td>{formatTime(event.end)}</td>
                  <td>{event.subject || "-"}</td>
                  <td>
                    <span className="badge badge-danger">Dolu</span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {futureEvents.length > 0 && (
        React.createElement("div", null,
          React.createElement("h3", { style: { marginTop: "30px" } }, "Rezerve Edilmiş Toplantılar"),
          React.createElement("table", { className: "meeting-table" },
            React.createElement("thead", null,
              React.createElement("tr", null,
                React.createElement("th", null, "Tarih"),
                React.createElement("th", null, "Başlangıç"),
                React.createElement("th", null, "Bitiş"),
                React.createElement("th", null, "Konu"),
                React.createElement("th", null, "Durum")
              )
            ),
            React.createElement("tbody", null,
              futureEvents.map(function(event) {
                return React.createElement("tr", { key: event.id },
                  React.createElement("td", null, formatDate(event.date)),
                  React.createElement("td", null, formatTime(event.start)),
                  React.createElement("td", null, formatTime(event.end)),
                  React.createElement("td", null, event.subject || "-"),
                  React.createElement("td", null,
                    React.createElement("span", { className: "badge badge-danger" }, "Dolu")
                  )
                );
              })
            )
          )
        )
      )}
    </div>
  );
}

export default RoomStatus;