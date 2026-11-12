<p align="center">
  <img src="public/logo.png" width="96" height="96" alt="Musicku Logo" style="border-radius: 24px;" />
</p>

<h1 align="center">Musicku — Liquid Audio Streaming</h1>

<p align="center">
  Aplikasi streaming musik modern berestetika <b>Apple iOS 26 Liquid Glassmorphism</b> dengan lirik real-time tersinkronisasi, kontrol Lock Screen (Media Session API), dan launcher terminal <b><code>opmusic</code></b>.
</p>

<p align="center">
  <a href="https://musickus.vercel.app">🌐 Live Demo (Cloud Production)</a> •
  <a href="#instalasi-global">🚀 Instalasi CLI</a> •
  <a href="#penggunaan-cli">💻 Penggunaan</a> •
  <a href="#clone--setup-lokal">🛠️ Setup Clone</a>
</p>

---

## Instalasi Global

Jalankan salah satu metode berikut untuk menginstal perintah **`opmusic`** secara global di terminal Anda:

### 1. Melalui npm link dari repositori lokal
```bash
npm link --ignore-scripts
```

### 2. Atau jalankan installer otomatis (Windows PowerShell)
```powershell
irm https://raw.githubusercontent.com/rajibjugi02-ctrl/Musicku/main/install.ps1 | iex
```

### 3. Atau jalankan installer otomatis (Linux / macOS)
```bash
curl -fsSL https://raw.githubusercontent.com/rajibjugi02-ctrl/Musicku/main/install.sh | bash
```

---

## Penggunaan CLI

Setelah terpasang, perintah `opmusic` dapat dipanggil kapan saja dari terminal:

```bash
# Buka Musicku (otomatis prioritas server lokal jika aktif, atau versi cloud)
opmusic

# Buka Musicku versi cloud production langsung
opmusic --cloud

# Jalankan server dev lokal Next.js dan langsung buka di browser
opmusic --dev

# Menampilkan versi CLI terpasang
opmusic --version

# Menampilkan bantuan parameter
opmusic --help
```

---

## Clone & Setup Lokal

Bagi yang ingin melakukan *clone* dan mengembangkan proyek ini di komputer lokal:

### 1. Clone Repositori
```bash
git clone https://github.com/rajibjugi02-ctrl/Musicku.git
cd Musicku/musicku-app
```

### 2. Konfigurasi Variabel Lingkungan (`.env`)
Salin template `.env.example` menjadi `.env` lalu isi kredensial Anda sendiri:
```bash
cp .env.example .env
```

> **Catatan Keamanan:** File `.env` asli dan database rahasia sudah otomatis diabaikan oleh `.gitignore` sehingga kredensial pribadi tidak akan pernah bocor ke GitHub.

### 3. Instal Dependensi & Generate Database
```bash
npm install
npx prisma generate
```

### 4. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda atau cukup ketik `opmusic` di terminal.

---

## Fitur Utama

- 🎵 **Full-Track Audio Streaming**: Pemutaran lagu penuh dengan fallback proxy audio berkecepatan tinggi.
- 🎤 **Synced Live Lyrics**: Lirik lagu berjalan otomatis dan tersinkronisasi baris demi baris secara presisi.
- 🔮 **iOS 26 Liquid Glass Aesthetic**: Tampilan antarmuka glassmorphism canggih dengan specular ambient lighting dan hardware acceleration 120fps.
- 📱 **Mobile Single-Layer Navbar**: Scrubbing tab bar fisik iOS bebas teks double / berbayang.
- 🔒 **Media Session Lock Screen**: Menampilkan judul lagu, artis, dan album art di layar kunci HP Android/iOS dan widget media Windows.
- 📦 **Multi-Platform Ready**: PWA installable, Capacitor Android APK, dan Electron Windows Desktop executable.

---

<p align="center">
  Dibuat dengan ❤️ oleh <b>Rajib Zahir</b>
</p>
