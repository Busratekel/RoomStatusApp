import React from "react";
import "./RoomDisplay.css";

// Basit ISO UTC formatlayıcı (toISOString kullanmadan)
function toIsoUtcString(date) {
  var d = new Date(date);
  var Y = d.getUTCFullYear();
  var M = d.getUTCMonth() + 1; // 1-12
  var D = d.getUTCDate();
  var h = d.getUTCHours();
  var m = d.getUTCMinutes();
  var s = d.getUTCSeconds();
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  return Y + "-" + pad(M) + "-" + pad(D) + "T" + pad(h) + ":" + pad(m) + ":" + pad(s) + ".000Z";
}

// Çok basit tarih formatı - Samsung TV uyumlu
function formatTime(date) {
  if (!date) return "00:00";
  
  var d = new Date(date);
  if (isNaN(d.getTime())) return "00:00";
  
  var hours = d.getHours();
  var minutes = d.getMinutes();
  
  var hoursStr = hours < 10 ? "0" + hours : "" + hours;
  var minutesStr = minutes < 10 ? "0" + minutes : "" + minutes;
  
  return hoursStr + ":" + minutesStr;
}

// Tarih formatı - Samsung TV uyumlu
function formatDate(date) {
  if (!date) return "";

  var d = new Date(date);
  if (isNaN(d.getTime())) return "";

  var day = d.getDate();
  var month = d.getMonth() + 1;
  var year = d.getFullYear();

  var dayStr = day < 10 ? "0" + day : "" + day;
  var monthStr = month < 10 ? "0" + month : "" + month;

  return dayStr + "." + monthStr + "." + year;
}

function RoomDisplay() {
  // Basit state yönetimi
  var roomNameState = React.useState("");
  var roomName = roomNameState[0];
  var setRoomName = roomNameState[1];
  
  var roomEmailState = React.useState("");
  var roomEmail = roomEmailState[0];
  var setRoomEmail = roomEmailState[1];
  
  var eventsState = React.useState([]);
  var events = eventsState[0];
  var setEvents = eventsState[1];
  
  var nowState = React.useState(new Date());
  var now = nowState[0];
  var setNow = nowState[1];

  // Oda bilgisini çek
  function fetchRoomData() {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "/room/rooms", true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              var data = JSON.parse(xhr.responseText);
              if (data && Array.isArray(data)) {
                for (var i = 0; i < data.length; i++) {
                  if (data[i].isActive) {
                    setRoomName(data[i].name || "Bilinmeyen Oda");
                    setRoomEmail(data[i].email || "");
                    // Oda bilgisi geldikten sonra toplantıları çek
                    fetchEventsWithEmail(data[i].email);
                    break;
                  }
                }
              }
            } catch (e) {
              setRoomName("JSON Hatası");
            }
          } else {
            setRoomName("HTTP Hatası: " + xhr.status);
          }
        }
      };
      xhr.onerror = function() {
        setRoomName("Network Hatası");
      };
      xhr.send();
    } catch (e) {
      setRoomName("Genel Hata");
    }
  }

  // Toplantı verilerini çek
  function fetchEventsWithEmail(email) {
    if (!email) {
      return;
    }
    
         try {
       var today = new Date();
       var start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
       var end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 23, 59, 59);
      
      var apiUrl = "/room/events?roomEmail=" + encodeURIComponent(email) + 
                  "&start=" + encodeURIComponent(toIsoUtcString(start)) + 
                  "&end=" + encodeURIComponent(toIsoUtcString(end)) +
                  "&cb=" + new Date().getTime();
      
      var xhr = new XMLHttpRequest();
      xhr.open("GET", apiUrl, true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              var data = JSON.parse(xhr.responseText);
              var eventsArray = [];
              
              if (Array.isArray(data)) {
                eventsArray = data;
              } else if (data && data.events && Array.isArray(data.events)) {
                eventsArray = data.events;
              }
              
              // Basit transform
              var transformed = [];
              for (var i = 0; i < eventsArray.length; i++) {
                var event = eventsArray[i];
                if (event && event.start && event.end) {
                  transformed.push({
                    id: event.id || "event-" + i,
                    subject: event.subject || "Toplantı",
                    start: event.start.dateTime || event.start,
                    end: event.end.dateTime || event.end,
                    organizer: event.organizer ? 
                              (event.organizer.emailAddress ? event.organizer.emailAddress.name : event.organizer) : 
                              "Bilinmeyen"
                  });
                }
              }
              
              setEvents(transformed);
            } catch (e) {
              setEvents([]);
            }
          } else {
            setEvents([]);
          }
        }
      };
      xhr.onerror = function() {
        setEvents([]);
      };
      xhr.send();
    } catch (e) {
      setEvents([]);
    }
  }

     // İlk yükleme ve 5 dakikada bir yenileme
   React.useEffect(function() {
     fetchRoomData();
     
     // 5 dakikada bir yenile (5 * 60 * 1000 = 300000 ms)
     var refreshTimer = setInterval(function() {
       fetchRoomData();
     }, 300000);
     
     return function() {
       clearInterval(refreshTimer);
     };
   }, []); // Boş array = sadece bir kez başlat

  // Saat güncelleme
  React.useEffect(function() {
    var timer = setInterval(function() {
      setNow(new Date());
    }, 1000);
    return function() {
      clearInterval(timer);
    };
  }, []);

  // Aktif toplantı bul
  var current = null;
  var nowTime = now.getTime();
  
  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    if (event.start && event.end) {
      var start2 = new Date(event.start).getTime();
      var end2 = new Date(event.end).getTime();
      
      if (nowTime >= start2 && nowTime < end2) {
        current = event;
        break;
      }
    }
  }

     // Sonraki toplantılar
   var nextEvents = [];
   for (var j = 0; j < events.length; j++) {
     var event2 = events[j];
     if (event2.start) {
       var start3 = new Date(event2.start).getTime();
       if (start3 > nowTime) {
         nextEvents.push(event2);
       }
     }
   }
   
   // Tarihe göre sırala (en yakın toplantıdan en uzağa)
   nextEvents.sort(function(a, b) {
     var aTime = new Date(a.start).getTime();
     var bTime = new Date(b.start).getTime();
     return aTime - bTime;
   });

  // Çok basit render
  try {
    return React.createElement("div", {
      style: {
        width: "100vw",
        height: "100vh",
        backgroundColor: "#181c23",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
        margin: "0",
        padding: "0",
        display: "block"
      }
    },
      // Sol taraf
      React.createElement("div", {
        style: {
          width: "50%",
          height: "100%",
          float: "left",
          padding: "20px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }
      },
        // Üst kısım
        React.createElement("div", {
          style: {
            textAlign: "center",
            flex: "1",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }
        },
                     React.createElement("div", {
             style: {
               color: current ? "#e53935" : "#8fffa0",
               fontSize: "64px",
               fontWeight: "bold",
               marginBottom: "40px"
             }
           }, "BUGÜN"),
           
           React.createElement("div", {
             style: {
               fontSize: "58px",
               fontWeight: "bold",
               marginBottom: "30px"
             }
           }, roomName || "Yükleniyor..."),
           
           // Düzenleyen satırı
           React.createElement("div", {
             style: {
               fontSize: "52px",
               marginBottom: "20px"
             }
           }, "Düzenleyen: " + (current ? current.organizer : "-")),
           
           // Toplantı konusu satırı
           React.createElement("div", {
             style: {
               fontSize: "48px",
               marginBottom: "20px",
               fontWeight: "bold"
             }
           }, current ? ("Konu: " + current.subject) : "Konu: -"),
           
           // Saat aralığı
           React.createElement("div", {
             style: {
               fontSize: "50px",
               fontWeight: "bold",
               border: "3px solid #ffffff",
               borderRadius: "15px",
               padding: "10px",
               backgroundColor: "rgba(255,255,255,0.1)",
               display: "inline-block"
             }
           }, current ? (formatTime(current.start) + " - " + formatTime(current.end)) : "")
        ),
        
                 // Alt kısım - DOLU / MÜSAİT barı
         React.createElement("div", {
           style: {
             backgroundColor: current ? "#e53935" : "#179c3c",
             color: "#ffffff",
             fontSize: "46px",
             fontWeight: "bold",
             textAlign: "center",
             padding: "16px",
             borderRadius: "10px"
           }
         }, current ? "DOLU" : "MÜSAİT")
      ),
      
      // Sağ taraf
      React.createElement("div", {
        style: {
          width: "50%",
          height: "100%",
          float: "right",
          backgroundColor: "#1ecb5a",
          color: "#181c23",
          padding: "20px",
          boxSizing: "border-box"
        }
      },
                 React.createElement("div", {
            style: {
              fontSize: "44px",
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: "15px",
              border: "3px solid #181c23",
              borderRadius: "15px",
              padding: "8px",
              backgroundColor: "rgba(255,255,255,0.1)"
            }
          }, formatTime(now)),
          
          React.createElement("div", {
            style: {
              fontSize: "24px",
              fontWeight: "bold",
              marginBottom: "15px",
              marginTop: "40px"
            }
          }, "PLANLANMIŞ TOPLANTILAR"),
          
                  nextEvents.length === 0 ?
            React.createElement("div", {
              style: {
                fontSize: "20px"
              }
            }, "Bu hafta planlanmış toplantı yok") :
                     React.createElement("div", null,
                          nextEvents.slice(0, 8).map(function(event3, index) {
                               return React.createElement("div", {
                  key: event3.id || index,
                  style: {
                    fontSize: "22px",
                    marginBottom: "16px",
                    padding: "10px",
                    backgroundColor: "rgba(0,0,0,0.1)"
                  }
                },
                  // Toplantı Tarihi ve saat aynı satırda
                  React.createElement("div", {
                    style: {
                      fontSize: "26px",
                      marginBottom: "6px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }
                  },
                    React.createElement("span", {
                      style: {
                        fontWeight: "normal"
                      }
                    }, [
                      React.createElement("span", {
                        key: "label",
                        style: {
                          fontWeight: "bold"
                        }
                      }, "Toplantı Tarihi: "),
                      formatDate(event3.start)
                    ]),
                    React.createElement("span", {
                      style: {
                        fontWeight: "bold"
                      }
                    }, formatTime(event3.start) + " - " + formatTime(event3.end))
                  ),
                  // Organizatör ayrı satırda
                  React.createElement("div", {
                    style: {
                      fontSize: "26px",
                      marginBottom: "4px",
                      fontWeight: "normal"
                    }
                  }, [
                    React.createElement("span", {
                      key: "label",
                      style: {
                        fontWeight: "bold"
                      }
                    }, "Düzenleyen: "),
                    event3.organizer
                  ]),
                  
                  // Konu ayrı satırda
                  React.createElement("div", {
                    style: {
                      fontWeight: "normal",
                      fontSize: "26px"
                    }
                  }, [
                    React.createElement("span", {
                      key: "label",
                      style: {
                        fontWeight: "bold"
                      }
                    }, "Konu: "),
                    event3.subject
                  ])
                );
              })
           )
      )
    );
  } catch (error) {
    return React.createElement("div", {
      style: {
        width: "100vw",
        height: "100vh",
        backgroundColor: "#181c23",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px",
        fontFamily: "Arial, sans-serif"
      }
    }, "Hata: " + (error.message || "Bilinmeyen hata"));
  }
}

export default RoomDisplay; 