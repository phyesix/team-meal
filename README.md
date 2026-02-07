# Takım Yemeği - Team Meal Rotation App

Takım yemeği rotasyon yönetim sistemi. Takımlar için haftalık yemek rotasyonunu, zar atma ile sıralama belirlemeyi ve araç atamalarını yönetir.

## Özellikler

- ✅ Kullanıcı kayıt ve giriş sistemi (e-posta doğrulaması yok)
- ✅ İlk kayıt olan kullanıcı otomatik admin olur
- ✅ Admin panel ile takım ve kullanıcı yönetimi
- ✅ Takım oluşturma ve katılma
- ✅ 2xD10 zar atma sistemi ile rotasyon sıralaması
- ✅ Yemek rotasyonu takibi
- ✅ Araç ataması ve eşit dağılım
- ✅ Otomatik döngü sıfırlama

## Teknolojiler

- **Framework**: Next.js 16 (App Router)
- **Dil**: TypeScript
- **Stil**: Tailwind CSS 4
- **Veritabanı**: Supabase (PostgreSQL)
- **Kimlik Doğrulama**: Supabase Auth

## Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
npm install
```

### 2. Supabase Projesi Oluşturun

1. [Supabase](https://supabase.com) hesabı oluşturun
2. Yeni bir proje oluşturun
3. Proje URL ve anon key'i kopyalayın

### 3. Veritabanını Kurun

1. Supabase Dashboard'da SQL Editor'ü açın
2. `supabase/migrations/001_initial_schema.sql` dosyasındaki SQL kodunu çalıştırın
3. Tüm tabloların ve politikaların oluşturulduğunu doğrulayın

### 4. Ortam Değişkenlerini Ayarlayın

`.env.local` dosyasını düzenleyin:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Uygulama http://localhost:3000 adresinde çalışacaktır.

## Kullanım

### İlk Kurulum

1. **İlk Kullanıcı Kaydı**: İlk kayıt olan kullanıcı otomatik olarak admin olur
2. **Takım Oluşturma**: Admin olarak giriş yapın ve yeni takım oluşturun
3. **Üye Davet**: Diğer kullanıcılar kayıt olup takıma katılabilir

### Rotasyon Akışı

1. **Zar Atma**: Tüm takım üyeleri 2xD10 zar atar
2. **Sıralama**: Zarların toplamına göre sıralama belirlenir
3. **Yemek Seçimi**: Sırayla her üye:
   - Restoran seçer
   - Tarih belirler
   - Sürücüleri atar
4. **Döngü Tamamlama**: Herkes sırasını tamamladığında döngü otomatik sıfırlanır

### Admin Paneli

Admin kullanıcılar şunları yapabilir:
- Yeni takım oluşturma
- Takım ayarlarını düzenleme (isim, max üye, araç kapasitesi)
- Kullanıcılara admin yetkisi verme/kaldırma
- Takımları silme
- Sistem istatistiklerini görüntüleme

## Proje Yapısı

```
team-meal/
├── app/
│   ├── (admin)/          # Admin panel sayfaları
│   ├── (auth)/           # Giriş/kayıt sayfaları
│   ├── (dashboard)/      # Ana uygulama sayfaları
│   └── api/              # API route'ları
├── components/           # React bileşenleri
├── lib/
│   ├── supabase/         # Supabase client yapılandırması
│   └── database.types.ts # TypeScript tipleri
├── supabase/
│   └── migrations/       # Veritabanı migration dosyaları
└── middleware.ts         # Auth middleware
```

## Veritabanı Şeması

- **profiles**: Kullanıcı profilleri ve admin durumu
- **teams**: Takım bilgileri
- **team_members**: Takım üyelikleri
- **cycles**: Rotasyon döngüleri
- **dice_rolls**: Zar atma kayıtları
- **meal_turns**: Yemek sıraları
- **vehicle_assignments**: Araç atamaları

## Güvenlik

- Row Level Security (RLS) tüm tablolarda aktif
- Admin işlemleri için yetki kontrolü
- Kullanıcılar sadece kendi verilerini düzenleyebilir
- Takım üyeleri sadece kendi takımlarının verilerini görebilir

## Lisans

MIT

## Destek

Sorularınız için issue açabilirsiniz.
