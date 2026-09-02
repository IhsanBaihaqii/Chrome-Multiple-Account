// ========================================
// ELEMEN DOM
// ========================================
const openBtn = document.getElementById("openBtn");
const jumlahInput = document.getElementById("jumlah");
const urlInput = document.getElementById("url");
const workerIPInput = document.getElementById("workerIP");
const message = document.getElementById("message");
const log = document.getElementById("log");

const controllerMode = document.getElementById("controllerMode");
const workerMode = document.getElementById("workerMode");
const controllerPanel = document.getElementById("controllerPanel");
const workerPanel = document.getElementById("workerPanel");
const workerStatus = document.getElementById("workerStatus");
const deviceInfo = document.getElementById("deviceInfo");

// ========================================
// CEK STATUS PERANGKAT
// ========================================
async function checkStatus() {
  try {
    const response = await fetch("/status");
    const data = await response.json();

    if (data.mode === "worker") {
      switchToWorkerMode();
      workerStatus.textContent = `✅ Mode Worker aktif di ${data.device}`;
      deviceInfo.textContent = `Chrome: ${data.chrome}`;
    } else {
      switchToControllerMode();
    }
  } catch (error) {
    console.error("Gagal cek status:", error);
  }
}

// ========================================
// SWITCH MODE
// ========================================
function switchToControllerMode() {
  controllerPanel.style.display = "block";
  workerPanel.style.display = "none";
  controllerMode.classList.add("active");
  workerMode.classList.remove("active");
}

function switchToWorkerMode() {
  controllerPanel.style.display = "none";
  workerPanel.style.display = "block";
  workerMode.classList.add("active");
  controllerMode.classList.remove("active");
}

// ========================================
// SET MODE
// ========================================
async function setMode(mode) {
  try {
    const response = await fetch("/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    const data = await response.json();

    if (data.success) {
      if (mode === "worker") {
        switchToWorkerMode();
        workerStatus.textContent = "✅ Mode Worker aktif";
      } else {
        switchToControllerMode();
      }
      message.textContent = `Mode diubah ke: ${mode}`;
    }
  } catch (error) {
    console.error("Gagal mengubah mode:", error);
  }
}

// ========================================
// KIRIM PERINTAH (Controller → Worker)
// ========================================
openBtn.addEventListener("click", async () => {
  const jumlah = parseInt(jumlahInput.value);
  let url = urlInput.value.trim();
  const workerIP = workerIPInput.value.trim();

  // Validasi
  if (!jumlah || jumlah < 1) {
    message.textContent = "❌ Masukkan jumlah akun.";
    return;
  }

  if (!url) {
    message.textContent = "❌ Masukkan URL tujuan.";
    return;
  }

  if (!workerIP) {
    message.textContent = "❌ Masukkan IP Worker.";
    return;
  }

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  // Tambahkan log
  addLog(`📤 Mengirim perintah ke ${workerIP}: ${jumlah} akun → ${url}`);

  try {
    const response = await fetch("/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jumlah, url, workerIP }),
    });

    const data = await response.json();

    if (data.success) {
      message.textContent = `✅ ${data.message}`;
      addLog(`✅ ${data.message}`);
    } else {
      message.textContent = `❌ ${data.message}`;
      addLog(`❌ ${data.message}`);
    }
  } catch (error) {
    message.textContent = "❌ Terjadi kesalahan.";
    addLog(`❌ Error: ${error.message}`);
    console.error(error);
  }
});

// ========================================
// EVENT LISTENER MODE
// ========================================
controllerMode.addEventListener("click", () => setMode("controller"));
workerMode.addEventListener("click", () => setMode("worker"));

// ========================================
// FUNGSI BANTUAN
// ========================================
function addLog(text) {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement("div");
  logEntry.textContent = `[${timestamp}] ${text}`;
  log.appendChild(logEntry);
  log.scrollTop = log.scrollHeight;
}

// ========================================
// INIT
// ========================================
checkStatus();

// Cek status setiap 10 detik
setInterval(checkStatus, 10000);
