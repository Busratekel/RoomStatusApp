# Meeting Room Status

Bu proje, toplantı odalarının durumunu takip etmek ve yönetmek için geliştirilmiş bir web uygulamasıdır. Microsoft Graph API kullanarak Exchange/Outlook takvimlerinden toplantı bilgilerini çeker ve görsel bir arayüz ile odaların mevcut durumunu gösterir.

## 🏗️ Proje Yapısı

Bu proje iki ana bileşenden oluşur:

### Backend (.NET Core Web API)
- **RoomStatusWebApp/**: .NET Core Web API projesi
  - Microsoft Graph API entegrasyonu
  - Entity Framework Core ile veritabanı yönetimi
  - SQL Server veritabanı
  - Swagger API dokümantasyonu

### Frontend (React)
- **room-status-app/**: React uygulaması
  - Modern ve responsive kullanıcı arayüzü
  - Gerçek zamanlı oda durumu gösterimi
  - Takvim entegrasyonu

## 🚀 Kurulum

### Gereksinimler

- .NET 8.0 SDK
- Node.js (v16 veya üzeri)
- SQL Server (LocalDB, Express veya üretim sürümü)
- Microsoft Graph API erişimi

### Backend Kurulumu

1. **Veritabanı bağlantısını yapılandırın:**
   ```bash
   cd RoomStatusWebApp
   ```
   
   `appsettings.json` dosyasında connection string'i güncelleyin:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=RoomStatusDb;Trusted_Connection=true;MultipleActiveResultSets=true"
     }
   }
   ```

2. **Veritabanı migration'larını çalıştırın:**
   ```bash
   dotnet ef database update
   ```

3. **Uygulamayı çalıştırın:**
   ```bash
   dotnet run
   ```

   API varsayılan olarak `https://localhost:7000` adresinde çalışacaktır.

### Frontend Kurulumu

1. **Bağımlılıkları yükleyin:**
   ```bash
   cd room-status-app
   npm install
   ```

2. **Uygulamayı çalıştırın:**
   ```bash
   npm start
   ```

   React uygulaması `http://localhost:3000` adresinde çalışacaktır.

## 📋 Özellikler

### 🔧 Backend Özellikleri
- **Microsoft Graph API Entegrasyonu**: Exchange/Outlook takvimlerinden toplantı bilgilerini çeker
- **Oda Yönetimi**: Toplantı odalarının eklenmesi, düzenlenmesi ve silinmesi
- **Toplantı Takibi**: Geçmiş ve gelecek toplantıların veritabanında saklanması
- **Otomatik Temizlik**: Eski toplantı kayıtlarının otomatik silinmesi
- **RESTful API**: Swagger ile dokümante edilmiş API endpoints

### 🎨 Frontend Özellikleri
- **Gerçek Zamanlı Durum**: Odaların mevcut durumunu anlık gösterim
- **Responsive Tasarım**: Mobil ve masaüstü uyumlu arayüz
- **Takvim Görünümü**: Toplantıların tarih ve saat bazında görüntülenmesi
- **Filtreleme**: Oda, tarih ve durum bazında filtreleme

## 🔌 API Endpoints

### Oda İşlemleri
- `GET /room/rooms` - Tüm odaları listeler
- `GET /room/events` - Belirli bir odanın toplantılarını getirir
- `POST /room/save-events` - Oda toplantılarını veritabanına kaydeder

### Parametreler
- `roomEmail`: Oda e-posta adresi
- `roomId`: Oda ID'si
- `start`: Başlangıç tarihi
- `end`: Bitiş tarihi

## 🗄️ Veritabanı Modelleri

### Room (Oda)
- `Id`: Benzersiz kimlik
- `Name`: Oda adı
- `Email`: Oda e-posta adresi
- `Location`: Oda konumu
- `Capacity`: Kapasite
- `IsActive`: Aktif durumu

### Meeting (Toplantı)
- `Id`: Benzersiz kimlik
- `Subject`: Toplantı konusu
- `StartTime`: Başlangıç zamanı
- `EndTime`: Bitiş zamanı
- `Organizer`: Organizatör
- `Attendees`: Katılımcılar
- `RoomId`: Oda referansı

## 🔧 Konfigürasyon

### Microsoft Graph API
Microsoft Graph API kullanımı için aşağıdaki ayarları yapmanız gerekir:

1. Azure Portal'da uygulama kaydı oluşturun
2. Graph API izinlerini ekleyin (Calendars.Read)
3. Client ID ve Client Secret'ı `appsettings.json`'a ekleyin

### CORS Ayarları
Frontend ve backend arasındaki iletişim için CORS ayarları yapılandırılmıştır.

## 🚀 Geliştirme

### Yeni Özellik Ekleme
1. Backend'de yeni controller veya service ekleyin
2. Gerekirse yeni model sınıfları oluşturun
3. Migration oluşturun: `dotnet ef migrations add MigrationName`
4. Frontend'de yeni bileşenler ekleyin

### Test
```bash
# Backend testleri
cd RoomStatusWebApp
dotnet test

# Frontend testleri
cd room-status-app
npm test
```

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🤝 Katkıda Bulunma

1. Bu repository'yi fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 İletişim

Proje ile ilgili sorularınız için issue açabilir veya geliştirici ile iletişime geçebilirsiniz. 

