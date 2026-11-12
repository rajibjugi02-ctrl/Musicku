#!/usr/bin/env node

/**
 * Musicku CLI — Liquid Audio Terminal Launcher
 * https://musickus.vercel.app
 */

const { exec, spawn } = require("child_process");
const http = require("http");
const os = require("os");
const path = require("path");
const fs = require("fs");

const PKG_VERSION = "0.1.0";
const CLOUD_URL = "https://musickus.vercel.app";
const LOCAL_URL = "http://localhost:3000";

// ANSI Terminal Colors
const CYAN = "\x1b[36m";
const BLUE = "\x1b[34m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const GRAY = "\x1b[90m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function printBanner() {
  console.log(`
${CYAN}${BOLD}   __  __           _      _            ${RESET}
${CYAN}${BOLD}  |  \\/  |_   _ ___(_) ___| | ___   _   ${RESET}
${BLUE}${BOLD}  | |\\/| | | | / __| |/ __| |/ / | | |  ${RESET}
${BLUE}${BOLD}  | |  | | |_| \\__ \\ | (__|   <| |_| |  ${RESET}
${CYAN}${BOLD}  |_|  |_|\\__,_|___/_|\\___|_|\\_\\\\__,_|  ${RESET}
${GRAY}  Liquid Audio Streaming — Apple iOS 26 Aesthetic${RESET}
${GRAY}  CLI Version: ${PKG_VERSION}${RESET}
`);
}

function printHelp() {
  printBanner();
  console.log(`${BOLD}Penggunaan:${RESET}`);
  console.log(`  ${CYAN}opmusic${RESET}              Buka Musicku (prioritas lokal jika aktif, atau cloud)`);
  console.log(`  ${CYAN}opmusic --cloud${RESET}      Buka Musicku versi cloud production (${CLOUD_URL})`);
  console.log(`  ${CYAN}opmusic --dev${RESET}        Jalankan server dev Next.js lokal dan buka browser`);
  console.log(`  ${CYAN}opmusic --version${RESET}    Tampilkan versi CLI terpasang`);
  console.log(`  ${CYAN}opmusic --help${RESET}       Tampilkan panduan parameter ini\n`);
  console.log(`${BOLD}Contoh:${RESET}`);
  console.log(`  $ ${GREEN}opmusic${RESET}`);
  console.log(`  $ ${GREEN}opmusic --cloud${RESET}`);
  console.log(`  $ ${GREEN}opmusic --dev${RESET}\n`);
}

function openUrl(url) {
  const platform = os.platform();

  if (platform === "win32") {
    // Check if Brave or Chrome exists to launch in sleek standalone app window
    const bravePath = "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe";
    const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

    if (fs.existsSync(bravePath)) {
      exec(`"${bravePath}" --app=${url}`);
      return;
    }
    if (fs.existsSync(chromePath)) {
      exec(`"${chromePath}" --app=${url}`);
      return;
    }
    // Fallback to default browser
    exec(`start "" "${url}"`);
  } else if (platform === "darwin") {
    exec(`open "${url}"`);
  } else {
    exec(`xdg-open "${url}"`);
  }
}

function checkLocalServer(callback) {
  const req = http.get(LOCAL_URL, { timeout: 600 }, (res) => {
    callback(true);
  });
  req.on("error", () => {
    callback(false);
  });
  req.on("timeout", () => {
    req.destroy();
    callback(false);
  });
}

function handleDefaultLaunch() {
  printBanner();
  process.stdout.write(`${GRAY}Memeriksa status server Musicku...${RESET}\r`);

  checkLocalServer((isLocalRunning) => {
    if (isLocalRunning) {
      console.log(`${GREEN}✔ Server lokal terdeteksi aktif pada ${LOCAL_URL}${RESET}`);
      console.log(`${CYAN}Membuka Musicku di jendela aplikasi...${RESET}\n`);
      openUrl(LOCAL_URL);
    } else {
      console.log(`${YELLOW}ℹ Server lokal tidak berjalan. Membuka versi Cloud Production:${RESET}`);
      console.log(`${CYAN}  ${CLOUD_URL}${RESET}`);
      console.log(`\n${GRAY}Tips: Gunakan 'opmusic --dev' untuk memulai server lokal secara otomatis.${RESET}\n`);
      openUrl(CLOUD_URL);
    }
  });
}

function handleDevLaunch() {
  printBanner();
  console.log(`${CYAN}Memulai server lokal Musicku (npm run dev)...${RESET}`);

  // Find project directory (either current or package root)
  const projectDir = path.resolve(__dirname, "..");
  const child = spawn("npm", ["run", "dev"], {
    cwd: projectDir,
    stdio: "inherit",
    shell: true,
  });

  // Wait a brief moment for Turbopack to initialize then open browser
  setTimeout(() => {
    console.log(`\n${GREEN}✔ Server dev siap! Membuka ${LOCAL_URL}...${RESET}\n`);
    openUrl(LOCAL_URL);
  }, 2200);

  child.on("error", (err) => {
    console.error(`Gagal memulai server dev:`, err);
  });
}

// ─────────────────────────────────────────────────────────────
// Argument Parsing
// ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const firstArg = args[0] ? args[0].toLowerCase() : "";

switch (firstArg) {
  case "-v":
  case "--version":
    console.log(`Musicku CLI v${PKG_VERSION}`);
    break;

  case "-h":
  case "--help":
  case "help":
    printHelp();
    break;

  case "-c":
  case "--cloud":
    printBanner();
    console.log(`${CYAN}Membuka Musicku Cloud Production:${RESET} ${CLOUD_URL}`);
    openUrl(CLOUD_URL);
    break;

  case "-d":
  case "--dev":
    handleDevLaunch();
    break;

  default:
    handleDefaultLaunch();
    break;
}

