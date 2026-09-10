// server.js
const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// MIDDLEWARE
// ========================================
app.use(express.json());

// ========================================
// DATA WORKERS
// ========================================
let discoveredWorkers = [];
let manualWorkers = [];

// ========================================
// KONFIGURASI PERANGKAT
// ========================================
let config = {
  mode: "worker",
  deviceName: os.hostname(),
  manualWorkers: [],
  discoveredWorkers: [],
};

// Load config
try {
  if (fs.existsSync("config.json")) {
    const savedConfig = JSON.parse(fs.readFileSync("config.json", "utf8"));
    config = { ...config, ...savedConfig };
    manualWorkers = config.manualWorkers || [];
    discoveredWorkers = config.discoveredWorkers || [];
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
// GET LOCAL IPs
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

// ========================================
// SAVE CONFIG
// ========================================
function saveConfig() {
  config.manualWorkers = manualWorkers;
  config.discoveredWorkers = discoveredWorkers;
  try {
    fs.writeFileSync("config.json", JSON.stringify(config, null, 2));
  } catch (err) {
    console.error("Gagal menyimpan config:", err.message);
  }
}

// ========================================
// AUTO DISCOVERY
// ========================================
async function discoverWorkers() {
  const localIPs = getLocalIPs();
  const discovered = [];

  for (const localIP of localIPs) {
    const subnet = localIP.substring(0, localIP.lastIndexOf("."));
    const commonIPs = [1, 2, 5, 10, 20, 50, 100, 150, 200, 250];

    for (const lastOctet of commonIPs) {
      const targetIP = `${subnet}.${lastOctet}`;
      if (targetIP === localIP) continue;

      try {
        const result = await pingWorker(targetIP);
        if (result) {
          discovered.push({
            id: `${targetIP}-${Date.now()}`,
            name: result.deviceName || targetIP,
            ip: targetIP,
            status: "online",
            lastSeen: new Date().toISOString(),
            discovered: true,
          });
          console.log(
            `✅ Ditemukan worker: ${result.deviceName || targetIP} (${targetIP})`,
          );
        }
      } catch (error) {
        // Skip timeout
      }
    }
  }

  return discovered;
}

// ========================================
// PING WORKER
// ========================================
function pingWorker(ip) {
  return new Promise((resolve) => {
    const timeout = 2000;

    const req = http.request(
      {
        hostname: ip,
        port: PORT,
        path: "/ping",
        method: "GET",
        timeout: timeout,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(null);
          }
        });
      },
    );

    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
    req.end();
  });
}

// ========================================
// GET ALL WORKERS
// ========================================
function getAllWorkers() {
  const all = [...manualWorkers];
  for (const discovered of discoveredWorkers) {
    const exists = all.some((w) => w.ip === discovered.ip);
    if (!exists) all.push(discovered);
  }
  return all;
}

// ========================================
// ENDPOINT: PING (untuk discovery)
// ========================================
app.get("/ping", (req, res) => {
  res.json({
    deviceName: config.deviceName,
    mode: config.mode,
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ========================================
// ENDPOINT: SET MODE (ganti worker/controller manual)
// ========================================
app.post("/mode", (req, res) => {
  const { mode } = req.body;
  if (!["worker", "controller"].includes(mode)) {
    return res.status(400).json({
      success: false,
      message: "Mode harus 'worker' atau 'controller'",
    });
  }
  config.mode = mode;
  saveConfig();
  console.log(`🔧 Mode diubah menjadi: ${mode.toUpperCase()}`);
  res.json({ success: true, mode });
});

// ========================================
// ENDPOINT: TAMBAH WORKER MANUAL
// ========================================
app.post("/add-worker", (req, res) => {
  const { ip, name } = req.body;

  if (!ip) {
    return res.status(400).json({
      success: false,
      message: "IP wajib diisi",
    });
  }

  const existing = manualWorkers.find((w) => w.ip === ip);
  if (!existing) {
    manualWorkers.push({
      id: `manual-${Date.now()}`,
      name: name || ip,
      ip: ip,
      status: "online",
      lastSeen: new Date().toISOString(),
      manual: true,
    });
  } else {
    existing.status = "online";
    existing.lastSeen = new Date().toISOString();
  }

  saveConfig();

  res.json({
    success: true,
    message: "Worker berhasil ditambahkan",
    workers: getAllWorkers(),
  });
});

// ========================================
// ENDPOINT: HAPUS WORKER
// ========================================
app.post("/remove-worker", (req, res) => {
  const { id } = req.body;
  manualWorkers = manualWorkers.filter((w) => w.id !== id);
  saveConfig();

  res.json({
    success: true,
    message: "Worker berhasil dihapus",
    workers: getAllWorkers(),
  });
});

// ========================================
// ENDPOINT: GET WORKERS
// ========================================
app.get("/workers", async (req, res) => {
  const allWorkers = getAllWorkers();

  // Update status untuk discovered workers
  for (const worker of allWorkers) {
    if (worker.discovered) {
      try {
        const result = await pingWorker(worker.ip);
        worker.status = result ? "online" : "offline";
        worker.lastSeen = new Date().toISOString();
      } catch {
        worker.status = "offline";
      }
    }
  }

  res.json({
    success: true,
    workers: allWorkers,
  });
});

// ========================================
// ENDPOINT: EXECUTE (untuk worker menerima perintah)
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
// ENDPOINT: CONTROL (kirim perintah ke workers)
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
// ENDPOINT: DISCOVER
// ========================================
app.post("/discover", async (req, res) => {
  try {
    const discovered = await discoverWorkers();
    discoveredWorkers = discovered;
    saveConfig();

    res.json({
      success: true,
      message: `Ditemukan ${discovered.length} perangkat`,
      workers: getAllWorkers(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal melakukan discovery: " + error.message,
    });
  }
});

// ========================================
// ENDPOINT: STATUS
// ========================================
app.get("/status", (req, res) => {
  res.json({
    device: config.deviceName,
    mode: config.mode,
    platform: process.platform,
    chrome: findChrome() ? "Tersedia" : "Tidak ditemukan",
    workersCount: getAllWorkers().length,
    ips: getLocalIPs(),
  });
});

// ========================================
// STATIC FILES
// ========================================
app.use(express.static("public"));

// ========================================
// START SERVER
// ========================================
app.listen(PORT, async () => {
  const ips = getLocalIPs();

  console.log(`\n========================================`);
  console.log(`✅ Server berjalan di http://localhost:${PORT}`);
  console.log(`========================================`);
  console.log(`📱 Nama perangkat: ${config.deviceName}`);
  console.log(`🔧 Mode saat ini: ${config.mode.toUpperCase()}`);
  console.log(`🌐 IP Address:`);
  ips.forEach((ip) => console.log(`   - http://${ip}:${PORT}`));
  console.log(`========================================\n`);
});
