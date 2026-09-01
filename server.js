const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(express.json());
app.use(express.static("public"));

// ========================================
// CARI LOKASI GOOGLE CHROME
// ========================================

function findChrome() {
  const possiblePaths = [
    // Chrome 64-bit
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",

    // Chrome 32-bit
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",

    // Chrome instalasi per-user
    path.join(
      process.env.LOCALAPPDATA || "",
      "Google",
      "Chrome",
      "Application",
      "chrome.exe",
    ),
  ];

  for (const chromePath of possiblePaths) {
    if (fs.existsSync(chromePath)) {
      return chromePath;
    }
  }

  return null;
}

// ========================================
// ENDPOINT BUKA CHROME
// ========================================

app.post("/open", (req, res) => {
  const { jumlah, url } = req.body;

  // Validasi
  if (!jumlah || !url) {
    return res.status(400).json({
      message: "Jumlah akun dan URL wajib diisi.",
    });
  }

  // Cari Chrome
  const chromePath = findChrome();

  if (!chromePath) {
    return res.status(500).json({
      message: "Google Chrome tidak ditemukan.",
    });
  }

  console.log("Chrome ditemukan:");
  console.log(chromePath);

  // ========================================
  // BUKA PROFILE
  // ========================================

  for (let i = 0; i < jumlah; i++) {
    let profile;

    // Profile pertama
    if (i === 0) {
      profile = "Default";
    }

    // Profile berikutnya
    else {
      profile = `Profile ${i}`;
    }

    console.log(`Membuka ${profile} → ${url}`);

    const child = spawn(
      chromePath,
      [`--profile-directory=${profile}`, "--new-window", url],
      {
        detached: true,
        stdio: "ignore",
      },
    );

    // Tangani error agar Node tidak crash
    child.on("error", (error) => {
      console.error(`Gagal membuka ${profile}:`, error.message);
    });

    child.unref();
  }

  res.json({
    message: `${jumlah} profile Chrome sedang dibuka.`,
  });
});

// ========================================
// SERVER
// ========================================

app.listen(3000, () => {
  console.log("Server berjalan di http://localhost:3000");
});
