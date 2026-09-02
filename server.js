// server.js
const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// ========================================
// KONFIGURASI
// ========================================
let config = {
  mode: "worker", // 'controller' atau 'worker'
  controllerIP: "", // IP controller jika mode worker
  deviceName: os.hostname(),
};

// Load config jika ada
try {
  if (fs.existsSync("config.json")) {
    const savedConfig = JSON.parse(fs.readFileSync("config.json", "utf8"));
    config = { ...config, ...savedConfig };
  }
} catch (err) {
  console.log("Config tidak ditemukan, menggunakan default");
}

// ========================================
// CARI LOKASI GOOGLE CHROME
// ========================================
function findChrome() {
  const possiblePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(
      process.env.LOCALAPPDATA || "",
      "Google",
      "Chrome",
      "Application",
      "chrome.exe",
    ),
  ];

  // Linux
  if (process.platform === "linux") {
    possiblePaths.push("/usr/bin/google-chrome", "/usr/bin/chromium-browser");
  }

  for (const chromePath of possiblePaths) {
    if (fs.existsSync(chromePath)) {
      return chromePath;
    }
  }
  return null;
}

// ========================================
// ENDPOINT UNTUK WORKER (MENERIMA PERINTAH)
// ========================================
app.post("/execute", (req, res) => {
  const { jumlah, url } = req.body;

  // Validasi
  if (!jumlah || !url) {
    return res.status(400).json({
      success: false,
      message: "Jumlah akun dan URL wajib diisi.",
    });
  }

  // Cari Chrome
  const chromePath = findChrome();
  if (!chromePath) {
    return res.status(500).json({
      success: false,
      message: "Google Chrome tidak ditemukan di perangkat ini.",
    });
  }

  console.log(
    `[${config.deviceName}] Menerima perintah: ${jumlah} profile → ${url}`,
  );

  // Buka profile
  const openedProfiles = [];
  for (let i = 0; i < jumlah; i++) {
    const profile = i === 0 ? "Default" : `Profile ${i}`;

    const child = spawn(
      chromePath,
      [`--profile-directory=${profile}`, "--new-window", url],
      {
        detached: true,
        stdio: "ignore",
      },
    );

    child.on("error", (error) => {
      console.error(`Gagal membuka ${profile}:`, error.message);
    });

    child.unref();
    openedProfiles.push(profile);
  }

  res.json({
    success: true,
    message: `✅ ${jumlah} profile Chrome dibuka di ${config.deviceName}`,
    device: config.deviceName,
    profiles: openedProfiles,
  });
});

// ========================================
// ENDPOINT UNTUK KONTROL (MENGIRIM PERINTAH KE WORKER)
// ========================================
app.post("/control", async (req, res) => {
  const { jumlah, url, workerIP } = req.body;

  if (!jumlah || !url || !workerIP) {
    return res.status(400).json({
      success: false,
      message: "Jumlah, URL, dan IP Worker wajib diisi.",
    });
  }

  try {
    // Kirim perintah ke worker
    const response = await fetch(`http://${workerIP}:${PORT}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jumlah, url }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error mengirim perintah:", error);
    res.status(500).json({
      success: false,
      message: `Gagal terhubung ke worker di ${workerIP}:${PORT}`,
      error: error.message,
    });
  }
});

// ========================================
// ENDPOINT UNTUK CEK STATUS
// ========================================
app.get("/status", (req, res) => {
  res.json({
    device: config.deviceName,
    mode: config.mode,
    platform: process.platform,
    chrome: findChrome() ? "Tersedia" : "Tidak ditemukan",
    workerIP: config.controllerIP || "Tidak diset",
  });
});

// ========================================
// ENDPOINT UNTUK UPDATE KONFIGURASI
// ========================================
app.post("/config", (req, res) => {
  const { mode, controllerIP } = req.body;

  if (mode) config.mode = mode;
  if (controllerIP) config.controllerIP = controllerIP;

  // Simpan konfigurasi
  fs.writeFileSync("config.json", JSON.stringify(config, null, 2));

  res.json({
    success: true,
    message: "Konfigurasi diperbarui",
    config,
  });
});

// ========================================
// START SERVER
// ========================================
app.listen(PORT, () => {
  console.log(`✅ Server berjalan di http://localhost:${PORT}`);
  console.log(`📱 Nama perangkat: ${config.deviceName}`);
  console.log(`🔧 Mode: ${config.mode}`);
  console.log(`🌐 IP Anda:`, getLocalIPs());
});

// ========================================
// FUNGSI BANTUAN
// ========================================
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}
