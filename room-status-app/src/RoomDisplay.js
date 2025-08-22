import React, { useEffect, useState } from "react";
// import config from "./config.json";
import "./RoomDisplay.css";

// Standart tarih/saat format fonksiyonları
const formatTime = (date) => {
  if (!date) return "00:00";
  
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    console.warn("Geçersiz tarih formatı:", date);
    return "00:00"; // Geçersiz tarih için varsayılan
  }
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`; // HH:MM formatı
};

const formatDate = (date) => {
  if (!date) return "01-01-2025";
  
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    console.warn("Geçersiz tarih formatı:", date);
    return "01-01-2025"; // Geçersiz tarih için varsayılan
  }
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`; // dd-mm-yyyy formatı
};

const formatDateTime = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`; // dd-mm-yyyy HH:MM:SS formatı
};

function RoomDisplay() {
  const [roomName, setRoomName] = useState("");
  const [roomEmail, setRoomEmail] = useState("");
  const [events, setEvents] = useState([]);
  const [now, setNow] = useState(new Date());

  // Samsung TV kontrolü
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isSamsungTV = userAgent.includes('samsung') || 
                       userAgent.includes('smart-tv') || 
                       userAgent.includes('tizen');
    
    if (isSamsungTV) {
      document.body.classList.add('samsung-tv');
      console.log("Samsung TV tespit edildi - özel CSS uygulanıyor");
    }
  }, []);

  // Microsoft Graph API verilerini frontend formatına dönüştür
  const transformEvents = (graphEvents) => {
    if (!Array.isArray(graphEvents)) return [];
    
    console.log("🔍 RoomDisplay - Transform edilecek veriler:", graphEvents.length, "toplantı");
    
         const transformed = graphEvents.map(event => {
               // API'den gelen veri yapısına göre düzelt
        const startDate = event.start?.dateTime || event.start;
        const endDate = event.end?.dateTime || event.end;
        

        
        const dateStr = startDate ? formatDate(startDate) : null;
       
               // Organizer'ı string'e çevir
        let organizerName = "Bilinmeyen";
        if (typeof event.organizer === 'string') {
          organizerName = event.organizer;
        } else if (event.organizer?.emailAddress?.name) {
          organizerName = event.organizer.emailAddress.name;
        } else if (event.organizer?.name) {
          organizerName = event.organizer.name;
        }
        
        const transformedEvent = {
          id: event.id,
          subject: event.subject || "Toplantı",
          start: startDate,
          end: endDate,
          date: dateStr,
          organizer: organizerName,
          attendees: event.attendees?.map(a => a.emailAddress?.name).filter(Boolean) || []
        };
      
             console.log(`📅 RoomDisplay - Toplantı: ${transformedEvent.subject} - ${transformedEvent.date} - ${transformedEvent.start} - Organizer: ${organizerName}`);
       console.log(`🔍 RoomDisplay - Organizer yapısı:`, event.organizer);
      return transformedEvent;
    });
    
         // Tekrarlayan toplantıları filtrele (aynı subject ve organizer olanları)
     const uniqueEvents = transformed.filter((event, index, self) => 
       index === self.findIndex(e => 
         e.subject === event.subject && 
         e.organizer === event.organizer &&
         e.start === event.start
       )
     );
     
     // Başlangıç saatine göre sırala
     const sorted = uniqueEvents.sort((a, b) => {
       if (!a.start || !b.start) return 0;
       return new Date(a.start) - new Date(b.start);
     });
     
     console.log("✅ RoomDisplay - Dönüştürülmüş ve sıralanmış toplantılar:", sorted.length);
     console.log("📊 Sıralama kontrolü:", sorted.map(e => `${e.subject} - ${e.start}`));
     return sorted;
  };

  // Oda bilgisini backend'den çek
  useEffect(() => {
    fetch("/room/rooms")
      .then(res => res.json())
      .then(data => {
        console.log("🏢 RoomDisplay - Oda verileri:", data);
        const activeRoom = Array.isArray(data) ? data.find(r => r.isActive) : null;
        console.log("🎯 RoomDisplay - Aktif oda:", activeRoom);
        if (activeRoom) {
          setRoomName(activeRoom.name);
          setRoomEmail(activeRoom.email);
          console.log("📧 RoomDisplay - Oda email set edildi:", activeRoom.email);
        }
      })
      .catch(error => {
        console.error("❌ RoomDisplay - Oda verisi çekme hatası:", error);
      });
  }, []);

  // Toplantı verilerini çek
  useEffect(() => {
    if (!roomEmail) {
      console.log("⏳ RoomDisplay - roomEmail yok, API çağrısı yapılmıyor");
      return;
    }
    
    console.log("🚀 RoomDisplay - API çağrısı başlıyor, roomEmail:", roomEmail);
    
         function fetchEvents() {
       // Bugünden başlayarak haftalık toplantıları al (7 gün)
       const today = new Date();
       const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
       const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 23, 59, 59);
      const apiUrl = `/room/events?roomEmail=${encodeURIComponent(roomEmail)}&start=${start.toISOString()}&end=${end.toISOString()}`;
      console.log("🌐 RoomDisplay - API URL:", apiUrl);
      fetch(apiUrl)
        .then((res) => res.json())
        .then((data) => {
          console.log("📡 RoomDisplay - API'den gelen ham veri:", data);
          const eventsArray = Array.isArray(data) ? data : (Array.isArray(data?.events) ? data.events : []);
          console.log("📊 RoomDisplay - İşlenecek toplantı sayısı:", eventsArray.length);
          const transformedEvents = transformEvents(eventsArray);
          console.log("✅ RoomDisplay - Dönüştürülmüş toplantılar:", transformedEvents);
          setEvents(transformedEvents);
        })
        .catch((error) => {
          console.error("RoomDisplay - Veri çekme hatası:", error);
          setEvents([]);
        });
    }
    fetchEvents();
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [roomEmail]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

     // Bugünün tarihini kullan - UTC format kullan
   const nowDate = new Date();
  const current = events.find(ev => {
    if (!ev.start || !ev.end) return false;
    
    const start = new Date(ev.start);
    const end = new Date(ev.end);
    const isCurrent = nowDate >= start && nowDate < end;
    
    console.log(`🔍 Toplantı kontrolü: ${ev.subject} - Başlangıç: ${formatDateTime(start)} - Bitiş: ${formatDateTime(end)} - Şu an: ${formatDateTime(nowDate)} - Aktif mi: ${isCurrent}`);
    
    return isCurrent;
  });

  // Şu anki toplantı ve sonraki toplantılar
  const nowTime = nowDate.getTime();
  const todayStr = formatDate(nowDate);
  let nextEvents = [];
  
  console.log("🕐 RoomDisplay - Şu anki zaman:", formatDateTime(nowDate));
  console.log("📅 RoomDisplay - Bugünün tarihi:", todayStr);
  console.log("🎯 RoomDisplay - Aktif toplantı:", current ? current.subject : "Yok");
  console.log("📋 RoomDisplay - Toplam toplantı sayısı:", events.length);
  if (events.length > 0) {
    // Bugünkü ve bugünden sonraki toplantıları ayır
    const todaysEvents = events.filter(ev => ev.date === todayStr);
    const futureEvents = events.filter(ev => ev.date > todayStr);
    // Sağda gösterilecek toplantılar: bugünkü saatten sonra başlayacaklar + gelecektekiler
    nextEvents = [
      ...todaysEvents.filter(ev => {
        if (!ev.start) return false;
        const start = new Date(ev.start).getTime();
        return start > nowTime;
      }),
      ...futureEvents
    ];
  }

  return (
    <div className="room-display-flex">
      <div className="room-display-main">
        <div style={{ fontWeight: 'bold', color: '#8fffa0', fontSize: '1.3rem', marginBottom: '12px', letterSpacing: '2px' }}>BUGÜN</div>
        <div className="room-title">{roomName}</div>
        <div className="room-main">
          {current ? (
            <>
              <div className="meeting-subject">KONUSU: {current.subject}</div>
              <div className="meeting-organizer">Düzenleyen: {current.organizer}</div>
              <div className="meeting-time">
                {formatTime(current.start)}
                {" - "}
                {formatTime(current.end)}
              </div>
              <div className={`room-status-box busy`}>
                DOLU
              </div>
            </>
          ) : (
            <>
              <div className="meeting-free">Şu anda toplantı yok</div>
              <div className={`room-status-box free`}>
                MÜSAİT
              </div>
            </>
          )}
        </div>
      </div>
      <div className="room-next-green">
        <div className="room-clock room-clock-green">{formatTime(now)}</div>
        <div className="next-content">
          <div className="next-title-green">PLANLANMIŞ TOPLANTILAR</div>
          {nextEvents.length === 0 ? (
            <div className="no-next">Bu hafta planlanmış başka toplantı yok</div>
          ) : (
            <ul>
              {nextEvents.map(ev => (
                <li key={ev.id}>
                  <div className="next-date">{formatDate(ev.start)}</div>
                  <div className="next-row">
                                         <span className="next-subject">{ev.subject} Toplantısı</span>
                    <span className="next-time">
                      {formatTime(ev.start)}
                      {" - "}
                      {formatTime(ev.end)}
                    </span>
                  </div>
                  <div className="next-organizer">{ev.organizer}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default RoomDisplay; 