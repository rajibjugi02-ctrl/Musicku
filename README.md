<p align="center">
  <img src="public/logo.png" width="108" height="108" alt="Musicku Logo" style="border-radius: 26px;" />
</p>

<h1 align="center">Musicku</h1>

<p align="center">
  <b>Aplikasi Web Streaming Musik Modern dengan Estetika Apple iOS 26 Liquid Glassmorphism, Lirik Real-Time Tersinkronisasi, dan Launcher Terminal <code>opmusic</code>.</b>
</p>

<p align="center">
  <a href="https://musickus.vercel.app"><img src="https://img.shields.io/badge/Production-musickus.vercel.app-0A84FF?style=flat-square&logo=vercel" alt="Vercel Production" /></a>
  <img src="https://img.shields.io/badge/Next.js-16.4.6-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.3.0-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/PWA-Ready-107C41?style=flat-square" alt="PWA Ready" />
</p>

<p align="center">
  <a href="#tentang-musicku">Tentang</a> •
  <a href="#teknologi--bahasa-pemrograman">Teknologi</a> •
  <a href="#fitur-utama">Fitur</a> •
  <a href="#instalasi-cli-opmusic">CLI opmusic</a> •
  <a href="#cara-instal-di-hp-android-apk">Instal APK</a> •
  <a href="#cara-instal-di-windows">Instal Windows</a> •
  <a href="#setup-pengembangan-lokal">Setup Lokal</a> •
  <a href="#variabel-lingkungan-env">Keamanan .env</a>
</p>

---

## Tentang Musicku

**Musicku** adalah platform pemutar musik berbasis web yang dibangun dengan standar performa tinggi dan fokus pada kenyamanan pendengar. Proyek ini memadukan estetika antarmuka **Apple iOS 26 Liquid Glassmorphism** (pendaran cahaya ambient reaktif, material kaca cair berlapis, serta fisika pegas *spring physics*) dengan mesin audio yang mampu memutar lagu penuh (*full-track streaming*) dan menampilkan lirik lagu yang tersinkronisasi baris demi baris secara langsung (*real-time timestamped lyrics*).

Aplikasi ini dapat diakses secara langsung melalui peramban web, diinstal sebagai aplikasi native di HP Android (tersedia paket **.apk** dan **PWA**), dijalankan sebagai aplikasi desktop mandiri di Windows, serta diluncurkan langsung dari terminal pengguna menggunakan perintah **`opmusic`**.

- **URL Live Production:** [https://musickus.vercel.app](https://musickus.vercel.app)
- **Repositori Resmi:** [github.com/rajibjugi02-ctrl/Musicku](https://github.com/rajibjugi02-ctrl/Musicku)

---

## Teknologi & Bahasa Pemrograman

Musicku dibangun di atas ekosistem modern yang menggabungkan performa render server Next.js dengan arsitektur reaktif di sisi klien:

### 1. Bahasa Pemrograman
- **TypeScript**: Digunakan pada 100% kode frontend dan backend API untuk memastikan keamanan tipe data (*type safety*), autokompleksi, dan mencegah bug runtime.
- **JavaScript (Node.js)**: Mesin eksekusi CLI terminal (`bin/opmusic.js`) dan desktop wrapper Electron (`electron-main.js`).
- **CSS3 (Modern Tailwind v4)**: Mengimplementasikan efek *backdrop-filter*, saturasi warna visionOS, glassmorphism, dan custom keyframe animations.
- **PowerShell & Bash**: Skrip installer otomatis lintas platform (`install.ps1` untuk Windows, `install.sh` untuk Linux/macOS).
- **SQL (PostgreSQL via Prisma)**: Skema basis data terstruktur untuk autentikasi dan penyimpanan data pengguna.

### 2. Framework & Library Inti

| Komponen | Teknologi | Versi | Peran & Kegunaan |
| :--- | :--- | :--- | :--- |
| **Framework Utama** | Next.js (App Router) | `16.4.6` | Server-Side Rendering (SSR), API route handlers, dan kompilasi Turbopack |
| **UI Library** | React | `19.3.0` | Komponen interaktif modern, React Server Components, dan hook performa |
| **Styling Engine** | Tailwind CSS | `4.3.3` | Utility-first styling modern tanpa overhead runtime |
| **Animasi & Interaksi** | Framer Motion | `14.12.0` | Animasi fisika pegas (*spring physics*), gesture dragging, dan transisi layout |
| **State Management** | Zustand | `5.1.0` | Pengelolaan state pemutar audio, antrean lagu, lirik, tema, dan profil |
| **Autentikasi** | NextAuth.js (Auth.js) | `5.0.0-beta.32` | Integrasi OAuth (Google & Spotify) serta enkripsi password bcrypt |
| **Database ORM** | Prisma Client & CLI | `5.22.0` | Komunikasi tipe-aman dengan PostgreSQL (Neon / Supabase) |
| **Lirik Lagu** | LRCLIB API | Native Fetch | Pengambilan data lirik lagu berbasis timestamp baris per baris (`.lrc`) |
| **Ikon Antarmuka** | Lucide React | `1.72.0` | Set ikon antarmuka SVG yang konsisten dan ringan |
| **Ekstraksi Warna** | ColorThief | `3.5.0` | Analisis warna dominan album art untuk pendaran cahaya ambient adaptif |
| **Cross-Platform** | Capacitor & Electron | Latest | Konfigurasi build mandiri untuk Android APK dan Windows desktop |

---

## Fitur Utama

### 1. Full-Track Audio Streaming
- Pemutaran lagu penuh tanpa batasan cuplikan 30 detik.
- Menggunakan endpoint proxy stream khusus (`/api/stream/proxy`) dengan penanganan parsial *HTTP Range Requests (206 Partial Content)* untuk buffering instan dan hemat kuota data.

### 2. Synced Real-Time Live Lyrics
- Lirik lagu bergerak otomatis secara presisi mengikuti posisi detik lagu yang sedang diputar.
- **Interactive Seeking**: Pengguna dapat mengklik baris lirik tertentu untuk langsung melompati pemutaran ke bagian bait lagu tersebut.

### 3. Apple iOS 26 Liquid Glassmorphism
- Lapisan kaca cair berlapis (*convex liquid lens*) dengan saturasi 190% dan blur 28px.
- **Adaptive Ambient Lighting**: Warna latar belakang aplikasi beradaptasi secara dinamis mengikuti warna dominan cover album yang sedang dimainkan.
- Dioptimalkan menggunakan akselerasi perangkat keras GPU (`transform-gpu`, `will-change`) sehingga animasi tetap berjalan halus di 60–120 FPS tanpa membebani baterai.

### 4. Single-Layer Mobile Navigation Bar
- Navbar mobile berbasis fisika pegas (*spring physics*) yang responsif terhadap sentuhan geser (*scrubbing*).
- Dirancang menggunakan **arsitektur single-layer** sehingga teks dan ikon 100% tajam serta terbebas dari masalah teks ganda (*ghosting/double text*).

### 5. Strict Music Search Engine
- Algoritma pencarian cerdas yang mengurutkan artis dan lagu berdasarkan relevansi ketat:
  - Kecocokan nama eksak (*exact match*) dan awalan (*startsWith*) diletakkan di urutan paling atas.
  - Lagu yang dibawakan langsung oleh artis bersangkutan diprioritaskan.
  - Varian karaoke atau lagu cover tanpa izin otomatis diberi penalti skor atau disaring keluar.
- Dilengkapi **`AbortController`** dan **debounce 300ms** untuk membatalkan request lama saat pengguna masih mengetik, mencegah tumpang tindih data lama (*race condition*).

### 6. Lock Screen Media Controls (Media Session API)
- Informasi lagu (judul, artis, album, dan artwork kualitas tinggi) langsung tampil di layar kunci (*Lock Screen*) HP Android, iPhone, dan widget kontrol volume Windows.
- Tombol fisik/headset untuk *Play, Pause, Next, Previous*, dan *Seek* terhubung langsung ke pemutar Musicku.

### 7. Manajemen Profil Pengguna
- Edit nama tampilan, username, bio, dan foto profil.
- Dilengkapi fitur kompresi foto otomatis di sisi klien menggunakan HTML5 Canvas sebelum disimpan, menjaga ukuran data tetap efisien.

---

## Instalasi CLI: `opmusic`

Musicku menyediakan antarmuka command-line (CLI) agar pengguna dapat membuka aplikasi langsung dari terminal.

### 1. Instalasi Otomatis (Rekomendasi)

**Untuk Pengguna Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/rajibjugi02-ctrl/Musicku/main/install.ps1 | iex
```

**Untuk Pengguna Linux / macOS (Bash / Zsh):**
```bash
curl -fsSL https://raw.githubusercontent.com/rajibjugi02-ctrl/Musicku/main/install.sh | bash
```

**Atau dari Folder Repositori Lokal:**
```bash
npm link --ignore-scripts
```

### 2. Penggunaan Perintah CLI

Setelah terpasang, perintah `opmusic` dapat dipanggil dari folder mana saja di terminal Anda:

```bash
# Buka Musicku (otomatis memprioritaskan server lokal jika aktif, atau versi cloud)
opmusic

# Buka langsung ke versi cloud production di Vercel
opmusic --cloud

# Jalankan server Next.js lokal (npm run dev) dan buka browser secara otomatis
opmusic --dev

# Tampilkan versi CLI yang terpasang
opmusic --version

# Tampilkan panduan penggunaan dan bantuan parameter
opmusic --help
```

---

## Cara Instal di HP Android (APK & PWA)

Anda tidak memerlukan Android Studio yang berat untuk memasang Musicku di HP Android:

### Opsi A: Menggunakan File APK Langsung (Offline Installer)
1. Ambil file **`Musicku.apk`** (berukuran sekitar 3.1 MB) dari folder utama proyek:
   ```text
   C:\Musicku\Musicku.apk
   ```
2. Kirim file `Musicku.apk` tersebut ke HP Android Anda (melalui WhatsApp Web, Telegram, Google Drive, atau kabel USB).
3. Buka file tersebut di HP, lalu ketuk **Install / Pasang**.
4. Jika HP meminta izin instalasi aplikasi di luar Play Store, pilih **Izinkan dari sumber ini / Allow**.
5. Musicku akan langsung muncul di menu HP Anda dengan ikon logo 3D neon note.

### Opsi B: Menggunakan PWA (Tanpa Unduh File APK)
1. Buka peramban **Google Chrome** atau **Brave** di HP Android Anda.
2. Kunjungi alamat: `https://musickus.vercel.app`.
3. Ketuk ikon titik tiga di pojok kanan atas peramban.
4. Pilih menu **"Tambahkan ke Layar Utama"** atau **"Instal Aplikasi"** (*Install App*).
5. Aplikasi akan terpasang di HP secara instan dengan sensasi aplikasi native (layar penuh tanpa bilah URL browser).

---

## Cara Instal di Windows

### Opsi A: Shortcut Jendela Aplikasi Mandiri (Paling Ringan)
Anda dapat membuat shortcut desktop yang membuka Musicku dalam mode jendela aplikasi mandiri (tanpa tab dan tanpa bar URL browser):
- **Target shortcut:**
  ```text
  "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" --app=https://musickus.vercel.app
  ```
  *(Atau ganti path dengan `chrome.exe` jika menggunakan Google Chrome).*
- Gunakan ikon: `public/app-icon.ico`.

### Opsi B: Instal Melalui Fitur PWA Browser
1. Buka `https://musickus.vercel.app` di peramban Brave, Chrome, atau Microsoft Edge di Windows.
2. Di bilah alamat URL sebelah kanan (di samping ikon bookmark bintang), klik tombol **"Install Musicku"** (ikon komputer dengan panah ke bawah).
3. Klik **Install**. Aplikasi akan langsung muncul di Start Menu dan Taskbar Windows Anda.

---

## Setup Pengembangan Lokal

Bagi pengembang yang ingin berkontribusi atau menjalankan proyek ini di komputer lokal:

### Prasyarat
- **Node.js**: Versi 20.x atau 22.x LTS (disarankan).
- **npm** atau **pnpm**.
- Database **PostgreSQL** (bisa menggunakan instance cloud gratis dari Neon atau Supabase).

### Langkah Instalasi
1. **Clone repositori:**
   ```bash
   git clone https://github.com/rajibjugi02-ctrl/Musicku.git
   cd Musicku/musicku-app
   ```

2. **Salin konfigurasi variabel lingkungan:**
   ```bash
   cp .env.example .env
   ```
   Buka file `.env` dan masukkan kredensial database serta API key Anda (lihat bagian berikutnya).

3. **Pasang dependensi:**
   ```bash
   npm install
   ```

4. **Sinkronisasi skema basis data:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Jalankan server pengembangan:**
   ```bash
   npm run dev
   ```
   Aplikasi akan aktif di [http://localhost:3000](http://localhost:3000).

---

## Variabel Lingkungan (.env) & Keamanan

File rahasia seperti `.env`, `.env.local`, `.env.production`, serta database SQLite lokal telah dimasukkan ke dalam `.gitignore` dengan proteksi ketat. Kredensial rahasia Anda **tidak akan pernah ikut ter-upload ke repositori publik GitHub**.

Pengembang lain yang meng-clone proyek ini cukup mengisi template pada file [`.env.example`](file:///.env.example):

```env
# ─── Konfigurasi Aplikasi ───────────────────────────────────────────────────────
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=buat_kunci_acak_minimal_32_karakter_di_sini

# ─── Koneksi Database (PostgreSQL / Neon / Supabase) ───────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/musicku?sslmode=require

# ─── Spotify Developer API (https://developer.spotify.com/dashboard) ────────────
SPOTIFY_CLIENT_ID=masukkan_spotify_client_id_anda
SPOTIFY_CLIENT_SECRET=masukkan_spotify_client_secret_anda
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=masukkan_spotify_client_id_anda

# ─── Google OAuth (https://console.cloud.google.com) ────────────────────────────
GOOGLE_CLIENT_ID=masukkan_google_client_id_anda
GOOGLE_CLIENT_SECRET=masukkan_google_client_secret_anda
```

---

## Struktur Direktori Proyek

```text
musicku-app/
├── bin/
│   └── opmusic.js              # Binary executable CLI launcher
├── public/
│   ├── .well-known/            # Digital Asset Links (assetlinks.json untuk TWA Android)
│   ├── app-icon.ico            # Ikon resolusi multi-tier untuk desktop Windows
│   ├── icon-192.png            # PWA manifest icon maskable 192x192
│   ├── icon-512.png            # PWA manifest icon maskable 512x512
│   ├── logo.png                # Brand logo 3D neon liquid note
│   ├── manifest.json           # Web App Manifest specification
│   └── sw.js                   # Service Worker untuk caching dan offline fallback
├── src/
│   ├── app/
│   │   ├── (app)/              # Route grup antarmuka utama pemutar
│   │   │   ├── artist/[id]/    # Halaman detail artis & diskografi
│   │   │   ├── library/        # Halaman custom playlist & library
│   │   │   ├── liked-artists/  # Halaman koleksi artis yang disukai
│   │   │   ├── profile/        # Halaman profil & edit avatar pengguna
│   │   │   ├── search/         # Mesin pencari lagu & artis presisi tinggi
│   │   │   └── settings/       # Pengaturan audio dan preferensi tema
│   │   ├── api/
│   │   │   ├── auth/           # NextAuth route handler & registrasi
│   │   │   ├── music/          # Unified music aggregator (Spotify + fallback)
│   │   │   ├── lyrics/         # Integrasi LRCLIB synced lyrics
│   │   │   └── stream/proxy/   # HTTP Range request audio stream proxy
│   │   ├── layout.tsx          # Root layout & anti-FOUC theme injector
│   │   └── middleware.ts       # Route protection & static asset bypass
│   ├── components/
│   │   ├── auth/               # Form login & registrasi dengan validasi
│   │   ├── home/               # Komponen discovery, rekomendasi, riwayat putar
│   │   ├── layout/             # Sidebar, MobileNav (single-layer), AmbientBackground
│   │   ├── player/             # Docked PlayerFooter, lyrics drawer, mobile sheet
│   │   └── ui/                 # Kartu lagu (TrackCard), ArtistCard, dialogs
│   ├── hooks/
│   │   └── useMediaSession.ts  # Integrasi Media Session API untuk Lock Screen
│   ├── lib/
│   │   ├── auth.ts             # Konfigurasi NextAuth v5 provider & session
│   │   ├── music-service.ts    # Algoritma relevance ranking lagu & artis
│   │   └── prisma.ts           # Singleton Prisma client
│   └── store/                  # Zustand stores (Player, Lyrics, UI, Profile)
├── capacitor.config.json       # Konfigurasi platform Android Capacitor
├── electron-main.js            # Main process wrapper desktop Windows
├── install.ps1                 # Installer 1-baris Windows PowerShell
├── install.sh                  # Installer 1-baris Linux/macOS
├── package.json                # Dependencies, scripts, dan deklarasi bin CLI
└── README.md                   # Dokumentasi resmi proyek
```

---

## Lisensi & Kontribusi

Proyek ini dibuat dan dikembangkan untuk tujuan edukasi serta eksplorasi teknologi antarmuka modern. Kontribusi, laporan kendala (*bug report*), dan saran perbaikan fitur terbuka melalui fitur *Pull Request* dan *Issues* di GitHub.

<p align="center">
  Didesain dan dikembangkan dengan penuh dedikasi oleh <b>Rajib Zahir</b>.
</p>
