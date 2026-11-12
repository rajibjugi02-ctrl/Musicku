#!/usr/bin/env bash
# Musicku CLI Linux / macOS Installer
# Run: curl -fsSL https://raw.githubusercontent.com/rajibjugi02-ctrl/Musicku/main/install.sh | bash

set -e

echo -e "\033[36m───────────────────────────────────────────────────────\033[0m"
echo -e "\033[36m   Musicku CLI Installer (Linux / macOS)\033[0m"
echo -e "\033[36m   Apple iOS 26 Liquid Audio Streaming\033[0m"
echo -e "\033[36m───────────────────────────────────────────────────────\033[0m"

if ! command -v node &> /dev/null; then
    echo -e "\033[31m[ERROR] Node.js diperlukan untuk menjalankan Musicku CLI.\033[0m"
    echo -e "Silakan instal Node.js di: https://nodejs.org"
    exit 1
fi

INSTALL_DIR="$HOME/.musicku"
BIN_DIR="$INSTALL_DIR/bin"
mkdir -p "$BIN_DIR"

CLI_URL="https://raw.githubusercontent.com/rajibjugi02-ctrl/Musicku/main/bin/opmusic.js"
TARGET_SCRIPT="$BIN_DIR/opmusic"

echo "Mengunduh Musicku CLI..."
if [ -f "./bin/opmusic.js" ]; then
    cp "./bin/opmusic.js" "$TARGET_SCRIPT"
else
    curl -fsSL "$CLI_URL" -o "$TARGET_SCRIPT"
fi
chmod +x "$TARGET_SCRIPT"

# Configure PATH in zshrc or bashrc
SHELL_CONFIG=""
if [ -f "$HOME/.zshrc" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
fi

if [ -n "$SHELL_CONFIG" ]; then
    if ! grep -q "$BIN_DIR" "$SHELL_CONFIG"; then
        echo "export PATH=\"\$PATH:$BIN_DIR\"" >> "$SHELL_CONFIG"
    fi
fi

echo -e "\n\033[32m───────────────────────────────────────────────────────\033[0m"
echo -e "\033[32m  ✔ Musicku CLI (opmusic) berhasil terpasang!\033[0m"
echo -e "\033[32m───────────────────────────────────────────────────────\033[0m\n"
echo -e "Jalankan perintah berikut:\n  \033[36mopmusic\033[0m          (Buka Musicku)\n  \033[36mopmusic --cloud\033[0m  (Buka versi Cloud)\n  \033[36mopmusic --dev\033[0m    (Jalankan server lokal)\n  \033[36mopmusic --help\033[0m   (Lihat panduan parameter)\n"
