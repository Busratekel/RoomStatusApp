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
    try {
      const userAgent = navigator.userAgent;
      const userAgentLower = userAgent.toLowerCase();
      const urlParams = new URLSearchParams(window.location.search);
      
      // User Agent bilgisini logla
      console.log("🔍 Tam User Agent:", userAgent);
      console.log("📱 Cihaz Bilgisi:", {
        userAgent: userAgent,
        platform: navigator.platform,
        vendor: navigator.vendor,
        appName: navigator.appName,
        appVersion: navigator.appVersion
      });
      
      // Manuel Samsung TV modu (URL'de ?samsung=true)
      const manualSamsungMode = urlParams.get('samsung') === 'true';
      
      // Otomatik Samsung TV tespiti - Samsung TV'ler için (Chrome dahil)
      const autoSamsungTV = userAgentLower.includes('samsung') || 
                           userAgentLower.includes('smart-tv') || 
                           userAgentLower.includes('tizen') ||
                           userAgentLower.includes('webos') ||
                           userAgentLower.includes('tv') ||
                           // Samsung TV'de Chrome kullanıldığında tespit
                           (userAgentLower.includes('chrome') && 
                            userAgentLower.includes('mobile') && 
                            userAgentLower.includes('linux'));
      
      console.log("🎯 Samsung TV Tespit Sonucu:", {
        manualMode: manualSamsungMode,
        autoDetected: autoSamsungTV,
        finalResult: manualSamsungMode || autoSamsungTV
      });
      
      // Samsung TV modu aktif et
      if (manualSamsungMode || autoSamsungTV) {
        document.body.classList.add('samsung-tv');
        console.log("✅ Samsung TV modu aktif - özel CSS uygulanıyor");
      } else {
        console.log("❌ Samsung TV modu aktif değil");
      }
    } catch (error) {
      console.error("Samsung TV tespit hatası:", error);
    }
  }, []);

  // Microsoft Graph API verilerini frontend formatına dönüştür
  const transformEvents = (graphEvents) => {
    if (!Array.isArray(graphEvents)) return [];
    
    console.log("🔍 Samsung TV - Transform edilecek veriler:", graphEvents.length, "toplantı");
    
        const transformed = graphEvents.map(event => {
               // API'den gelen veri yapısına göre düzelt
        const startDate = event.start?.dateTime || event.start;
        const endDate = event.end?.dateTime || event.end;
        
        console.log("📅 Samsung TV - Toplantı verisi:", {
          subject: event.subject,
          start: startDate,
          end: endDate,
          organizer: event.organizer
        });
        
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
     return sorted;
  };

  // Oda bilgisini backend'den çek
  useEffect(() => {
    fetch("/room/rooms")
      .then(res => res.json())
      .then(data => {
        const activeRoom = Array.isArray(data) ? data.find(r => r.isActive) : null;
        if (activeRoom) {
          setRoomName(activeRoom.name);
          setRoomEmail(activeRoom.email);
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
      fetch(apiUrl)
        .then((res) => res.json())
        .then((data) => {
          const eventsArray = Array.isArray(data) ? data : (Array.isArray(data?.events) ? data.events : []);
          const transformedEvents = transformEvents(eventsArray);
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
   console.log("🕐 Samsung TV - Şu anki zaman:", formatDateTime(nowDate));
   
   const current = events.find(ev => {
     if (!ev.start || !ev.end) return false;
     
     const start = new Date(ev.start);
     const end = new Date(ev.end);
     const isCurrent = nowDate >= start && nowDate < end;
     
     console.log(`🔍 Samsung TV - Toplantı kontrolü: ${ev.subject} - Başlangıç: ${formatDateTime(start)} - Bitiş: ${formatDateTime(end)} - Aktif mi: ${isCurrent}`);
     
     return isCurrent;
   });
   
   console.log("🎯 Samsung TV - Aktif toplantı:", current ? current.subject : "Yok");

  // Şu anki toplantı ve sonraki toplantılar
  const nowTime = nowDate.getTime();
  const todayStr = formatDate(nowDate);
  let nextEvents = [];
  
  //console.log("🕐 RoomDisplay - Şu anki zaman:", formatDateTime(nowDate));
  //console.log("📅 RoomDisplay - Bugünün tarihi:", todayStr);
  //console.log("🎯 RoomDisplay - Aktif toplantı:", current ? current.subject : "Yok");
  //console.log("📋 RoomDisplay - Toplam toplantı sayısı:", events.length);
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

  try {
    console.log("🎯 Samsung TV - Render başlıyor");
    console.log("📊 Samsung TV - State değerleri:", {
      roomName,
      events: events.length,
      current: current ? current.subject : "Yok",
      nextEvents: nextEvents.length
    });
    
    // Samsung TV'de basit test
    if (document.body.classList.contains('samsung-tv')) {
      console.log("✅ Samsung TV modu aktif - basit render");
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'row',
          height: '100vh', 
          backgroundColor: '#181c23',
          color: '#fff',
          fontSize: '2rem'
        }}>
          <div style={{ flex: 1, padding: '20px', backgroundColor: '#181c23' }}>
            <div style={{ color: '#8fffa0', fontSize: '1.8rem' }}>BUGÜN</div>
            <div style={{ fontSize: '2.4rem', marginTop: '40px' }}>{roomName || "Yükleniyor..."}</div>
            <div style={{ marginTop: '50px' }}>
              {current ? (
                <div style={{ color: '#e53935', fontSize: '3rem', fontWeight: 'bold' }}>DOLU</div>
              ) : (
                <div style={{ color: '#179c3c', fontSize: '3rem', fontWeight: 'bold' }}>MÜSAİT</div>
              )}
            </div>
          </div>
          <div style={{ flex: 1, padding: '20px', backgroundColor: '#1ecb5a', color: '#181c23' }}>
            <div style={{ fontSize: '2.5rem', textAlign: 'center' }}>{formatTime(now)}</div>
            <div style={{ fontSize: '1.5rem', marginTop: '20px' }}>PLANLANMIŞ TOPLANTILAR</div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="room-display-flex">
        <div className="room-display-main">
          <div style={{ fontWeight: 'bold', color: '#8fffa0', fontSize: '1.8rem', marginBottom: '12px', letterSpacing: '2px' }}>BUGÜN</div>
          <div className="room-title">{roomName || "Yükleniyor..."}</div>
          <div className="room-main">
            {current ? (
              <>
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
                      <span className="next-organizer">{ev.organizer}</span>
                      <span className="next-time">
                        {formatTime(ev.start)}
                        {" - "}
                        {formatTime(ev.end)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("❌ Samsung TV - Render hatası:", error);
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: '#181c23',
        color: '#fff',
        fontSize: '2rem'
      }}>
        Samsung TV Hatası: {error.message}
      </div>
    );
  }
}

export default RoomDisplay; 