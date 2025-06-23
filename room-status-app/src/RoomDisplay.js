import React, { useEffect, useState } from "react";
// import config from "./config.json";
import "./RoomDisplay.css";

function RoomDisplay() {
  const [roomName, setRoomName] = useState("");
  const [roomEmail, setRoomEmail] = useState("");
  const [events, setEvents] = useState([]);
  const [now, setNow] = useState(new Date());

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
      });
  }, []);

  // Toplantı verilerini çek
  useEffect(() => {
    if (!roomEmail) return;
    function fetchEvents() {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14, 23, 59, 59);
      const apiUrl = `/room/events?roomEmail=${encodeURIComponent(roomEmail)}&start=${start.toISOString()}&end=${end.toISOString()}`;
      fetch(apiUrl)
        .then((res) => res.json())
        .then((data) => {
          const eventsArray = Array.isArray(data) ? data : (Array.isArray(data?.events) ? data.events : []);
          setEvents(eventsArray);
        })
        .catch(() => setEvents([]));
    }
    fetchEvents();
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [roomEmail]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Şu anki toplantı ve sonraki toplantılar
  const nowDate = new Date();
  const current = events.find(ev => {
    const start = new Date(ev.start);
    const end = new Date(ev.end);
    return nowDate >= start && nowDate < end;
  });

  // Şu anki toplantı ve sonraki toplantılar
  const nowTime = now.getTime();
  const todayStr = now.toISOString().slice(0, 10);
  let nextEvents = [];
  if (events.length > 0) {
    // Bugünkü ve bugünden sonraki toplantıları ayır
    const todaysEvents = events.filter(ev => ev.date === todayStr);
    const futureEvents = events.filter(ev => ev.date > todayStr);
    // Sağda gösterilecek toplantılar: bugünkü saatten sonra başlayacaklar + gelecektekiler
    nextEvents = [
      ...todaysEvents.filter(ev => {
        const start = new Date(ev.start.replace('T', ' ')).getTime();
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
                {new Date(current.start.replace('T', ' ')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                {" - "}
                {new Date(current.end.replace('T', ' ')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
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
        <div className="room-clock room-clock-green">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
        <div className="next-content">
          <div className="next-title-green">PLANLANMIŞ TOPLANTILAR</div>
          {nextEvents.length === 0 ? (
            <div className="no-next">Bu hafta planlanmış başka toplantı yok</div>
          ) : (
            <ul>
              {nextEvents.map(ev => (
                <li key={ev.id}>
                  <div className="next-date">{new Date(ev.start.replace('T', ' ')).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' })}</div>
                  <div className="next-row">
                    <span className="next-subject">{ev.subject} Toplantısı</span>
                    <span className="next-time">
                      {new Date(ev.start.replace('T', ' ')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                      {" - "}
                      {new Date(ev.end.replace('T', ' ')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
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