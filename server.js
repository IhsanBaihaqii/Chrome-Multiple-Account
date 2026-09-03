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
// DATA STATIS
// ========================================
const VALID_USERNAME = "admin";
const VALID_PASSWORD = "admin123";

// Daftar perangkat worker (akan diisi otomatis dari worker yang terdaftar)
let registeredWorkers = [];

// ========================================
// KONFIGURASI PERANGKAT
// ========================================
let config = {
  mode: "controller", // default controller
  deviceName: os.hostname(),
  registeredWorkers: [],
};

// Load config jika ada
try {
  if (fs.existsSync("config.json")) {
    const savedConfig = JSON.parse(fs.readFileSync("config.json", "utf8"));
    config = { ...config, ...savedConfig };
    registeredWorkers = config.registeredWorkers || [];
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

  if (process.platform === "linux") {
    possiblePaths.push("/usr/bin/google-chrome", "/usr/bin/chromium-browser");
  }

  if (process.platform === "darwin") {
    possiblePaths.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    );
  }

  for (const chromePath of possiblePaths) {
    if (fs.existsSync(chromePath)) {
      return chromePath;
    }
  }
  return null;
}

// ========================================
// ENDPOINT LOGIN
// ========================================
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === VALID_USERNAME && password === VALID_PASSWORD) {
    res.json({
      success: true,
      message: "Login berhasil",
      redirect: "/dashboard.html",
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Username atau password salah",
    });
  }
});

// ========================================
// ENDPOINT UNTUK WORKER REGISTER
// ========================================
app.post("/register", (req, res) => {
  const { ip, name } = req.body;

  if (!ip || !name) {
    return res.status(400).json({
      success: false,
      message: "IP dan nama perangkat wajib diisi",
    });
  }

  // Cek apakah sudah terdaftar
  const existing = registeredWorkers.find((w) => w.ip === ip);
  if (!existing) {
    registeredWorkers.push({
      id: Date.now().toString(),
      name: name,
      ip: ip,
      status: "online",
      lastSeen: new Date().toISOString(),
    });
    saveConfig();
  } else {
    existing.status = "online";
    existing.lastSeen = new Date().toISOString();
    saveConfig();
  }

  res.json({
    success: true,
    message: "Worker berhasil terdaftar",
    workers: registeredWorkers,
  });
});

// ========================================
// ENDPOINT GET WORKERS
// ========================================
app.get("/workers", (req, res) => {
  res.json({
    success: true,
    workers: registeredWorkers,
  });
});

// ========================================
// ENDPOINT UNTUK WORKER (MENERIMA PERINTAH)
// ========================================
app.post("/execute", (req, res) => {
  const { jumlah, url } = req.body;

  if (!jumlah || !url) {
    return res.status(400).json({
      success: false,
      message: "Jumlah akun dan URL wajib diisi.",
    });
  }

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
  const { jumlah, url, workers } = req.body;

  if (!jumlah || !url || !workers || workers.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Jumlah, URL, dan minimal 1 worker wajib diisi.",
    });
  }

  const results = [];
  const errors = [];

  for (const worker of workers) {
    try {
      const response = await fetch(`http://${worker.ip}:${PORT}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jumlah, url }),
      });

      const data = await response.json();

      if (data.success) {
        results.push({
          worker: worker.name,
          ip: worker.ip,
          status: "success",
          message: data.message,
        });
      } else {
        errors.push({
          worker: worker.name,
          ip: worker.ip,
          status: "error",
          message: data.message || "Gagal menjalankan perintah",
        });
      }
    } catch (error) {
      errors.push({
        worker: worker.name,
        ip: worker.ip,
        status: "error",
        message: `Tidak dapat terhubung: ${error.message}`,
      });
    }
  }

  res.json({
    success: true,
    total: workers.length,
    success_count: results.length,
    error_count: errors.length,
    results: results,
    errors: errors,
  });
});

// ========================================
// ENDPOINT UNTUK UPDATE STATUS WORKER
// ========================================
app.post("/worker/status", (req, res) => {
  const { ip, status } = req.body;

  const worker = registeredWorkers.find((w) => w.ip === ip);
  if (worker) {
    worker.status = status || "online";
    worker.lastSeen = new Date().toISOString();
    saveConfig();
  }

  res.json({ success: true });
});

// ========================================
// ENDPOINT UNTUK LOGOUT
// ========================================
app.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logout berhasil" });
});

// ========================================
// FUNGSI BANTUAN
// ========================================
function saveConfig() {
  config.registeredWorkers = registeredWorkers;
  fs.writeFileSync("config.json", JSON.stringify(config, null, 2));
}

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

// ========================================
// START SERVER
// ========================================
app.listen(PORT, () => {
  console.log(`✅ Server berjalan di http://localhost:${PORT}`);
  console.log(`📱 Nama perangkat: ${config.deviceName}`);
  console.log(`🌐 IP Anda:`, getLocalIPs());
  console.log(`👥 Worker terdaftar: ${registeredWorkers.length}`);
});
