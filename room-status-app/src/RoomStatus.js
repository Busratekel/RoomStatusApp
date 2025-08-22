import React, { useEffect, useState } from "react";
import config from "./config.json";
import "./RoomStatus.css";

function RoomStatus() {
  console.log("🚀 RoomStatus component başladı!");
  const roomEmail = config.roomEmail;
  const roomName = config.roomName;
  const [events, setEvents] = useState([]);
  
  console.log("📧 Room email:", roomEmail);
  console.log("🏠 Room name:", roomName);

  // Microsoft Graph API verilerini frontend formatına dönüştür
  const transformEvents = (graphEvents) => {
    if (!Array.isArray(graphEvents)) return [];
    
    console.log("🔍 Transform edilecek veriler:", graphEvents.length, "toplantı");
    
    const transformed = graphEvents.map(event => {
      const startDate = event.start?.dateTime;
      const endDate = event.end?.dateTime;
      const dateStr = startDate ? new Date(startDate).toISOString().slice(0, 10) : null;
      
      const transformedEvent = {
        id: event.id,
        subject: event.subject || "Toplantı",
        start: startDate,
        end: endDate,
        date: dateStr,
        organizer: event.organizer?.emailAddress?.name || "Bilinmeyen",
        attendees: event.attendees?.map(a => a.emailAddress?.name).filter(Boolean) || []
      };
      
      console.log(`📅 Toplantı: ${transformedEvent.subject} - ${transformedEvent.date} - ${transformedEvent.start}`);
      return transformedEvent;
    });
    
    // Başlangıç saatine göre sırala
    const sorted = transformed.sort((a, b) => {
      if (!a.start || !b.start) return 0;
      return new Date(a.start) - new Date(b.start);
    });
    
    console.log("✅ Dönüştürülmüş toplantılar:", sorted.length);
    return sorted;
  };

  // Toplantı verilerini her 5 dakikada bir çek
  useEffect(() => {
         function fetchEvents() {
       // 2025 Ağustos ayındaki toplantıları al
       const start = new Date(2025, 7, 20, 21, 0, 0); // 20 Ağustos 2025 21:00
       const end = new Date(2025, 8, 4, 20, 59, 59);  // 4 Eylül 2025 20:59

      const apiUrl = `/room/events?roomEmail=${encodeURIComponent(roomEmail)}&start=${start.toISOString()}&end=${end.toISOString()}`;
      fetch(apiUrl)
        .then((res) => res.json())
        .then((data) => {
          console.log("📡 API'den gelen ham veri:", data);
          const eventsArray = Array.isArray(data) ? data : (Array.isArray(data?.events) ? data.events : []);
          const transformedEvents = transformEvents(eventsArray);
          console.log("🔄 Dönüştürülmüş veri:", transformedEvents);
          setEvents(transformedEvents);
        })
        .catch((error) => {
          console.error("Veri çekme hatası:", error);
          setEvents([]);
        });
    }

    fetchEvents(); // ilk açılışta hemen çek
    const interval = setInterval(fetchEvents, 5 * 60 * 1000); // her 5 dakikada bir çek

    return () => clearInterval(interval); // component kapanınca timer'ı temizle
  }, [roomEmail]);

  // Test için 2025 Ağustos ayındaki toplantıları göster
  const today = new Date(2025, 7, 21); // 21 Ağustos 2025
  const todayStr = today.toISOString().slice(0, 10);
  const now = today.getTime();
  const eighteen = new Date(2025, 7, 21, 18, 0, 0).getTime();

  // Debug için tüm verileri logla
  console.log("TODAY STR:", todayStr);
  console.log("EVENTS:", events);
  console.log("EVENTS DATES:", events.map(e => e.date));
  
  // Şimdilik tüm toplantıları göster
  const todaysEvents = events.filter(e => e.date === todayStr);
  const futureEvents = events.filter(e => e.date !== todayStr);
  
  console.log("TODAYS EVENTS:", todaysEvents);
  console.log("FUTURE EVENTS:", futureEvents);

  // Satır rengi belirleme fonksiyonu
  function getRowClass(event) {
    if (!event.start || !event.end) return "";
    const start = new Date(event.start.replace('T', ' ')).getTime();
    const end = new Date(event.end.replace('T', ' ')).getTime();
    if (now > end) return "row-finished"; // yeşil
    if (now >= start && now <= end) return "row-busy"; // kırmızı
    return "";
  }

  // Tarih formatı fonksiyonu
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
            todaysEvents.map((event) => (
              <tr key={event.id} className={getRowClass(event)}>
                <td>{formatDate(event.date)}</td>
                <td>{event.start ? new Date(event.start.replace('T', ' ')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "-"}</td>
                <td>{event.end ? new Date(event.end.replace('T', ' ')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "-"}</td>
                <td>{event.subject || "-"}</td>
                <td>
                  <span className="badge badge-danger">Dolu</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {futureEvents.length > 0 && (
        <>
          <h3 style={{ marginTop: "30px" }}>Rezerve Edilmiş Toplantılar</h3>
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
              {futureEvents.map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.date)}</td>
                  <td>{event.start ? new Date(event.start.replace('T', ' ')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "-"}</td>
                  <td>{event.end ? new Date(event.end.replace('T', ' ')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "-"}</td>
                  <td>{event.subject || "-"}</td>
                  <td>
                    <span className="badge badge-danger">Dolu</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default RoomStatus;