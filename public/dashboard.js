// ========================================
// DASHBOARD LOGIC
// ========================================
let workers = [];
let selectedWorkers = [];
let isLoggedIn = false;
let currentMode = "worker";

// DOM Elements
const deviceList = document.getElementById("deviceList");
const selectAll = document.getElementById("selectAll");
const selectedCount = document.getElementById("selectedCount");
const executeBtn = document.getElementById("executeBtn");
const jumlahAkun = document.getElementById("jumlahAkun");
const targetUrl = document.getElementById("targetUrl");
const resultContainer = document.getElementById("resultContainer");
const resultSummary = document.getElementById("resultSummary");
const resultDetail = document.getElementById("resultDetail");
const logoutBtn = document.getElementById("logoutBtn");
const toast = document.getElementById("toast");
const modeIndicator = document.getElementById("modeIndicator");
const deviceNameDisplay = document.getElementById("deviceNameDisplay");
const discoverBtn = document.getElementById("discoverBtn");
const addWorkerBtn = document.getElementById("addWorkerBtn");
const manualIP = document.getElementById("manualIP");
const manualName = document.getElementById("manualName");
const myIP = document.getElementById("myIP");

// ========================================
// CHECK SESSION
// ========================================
async function checkSession() {
  try {
    const response = await fetch("/session");
    const data = await response.json();

    isLoggedIn = data.isLoggedIn;
    currentMode = data.mode;

    updateModeUI();

    if (!isLoggedIn) {
      window.location.href = "/";
      return;
    }

    await loadWorkers();
    await getMyIP();
  } catch (error) {
    console.error("Error checking session:", error);
    showToast("Gagal memeriksa session", "error");
  }
}

// ========================================
// GET MY IP
// ========================================
async function getMyIP() {
  try {
    const response = await fetch("/status");
    const data = await response.json();
    if (data.ips && data.ips.length > 0) {
      myIP.textContent = data.ips.join(", ");
    }
  } catch (error) {
    console.error("Error getting IP:", error);
  }
}

// ========================================
// UPDATE MODE UI
// ========================================
function updateModeUI() {
  if (modeIndicator) {
    if (currentMode === "controller") {
      modeIndicator.textContent = "🎮 CONTROLLER";
      modeIndicator.className = "mode-indicator controller";
    } else {
      modeIndicator.textContent = "⚙️ WORKER";
      modeIndicator.className = "mode-indicator worker";
    }
  }

  if (deviceNameDisplay) {
    deviceNameDisplay.textContent = `Device: ${getDeviceNameFromStatus()}`;
  }
}

async function getDeviceNameFromStatus() {
  try {
    const response = await fetch("/status");
    const data = await response.json();
    return data.device || "Unknown";
  } catch {
    return "Unknown";
  }
}

// ========================================
// LOAD WORKERS
// ========================================
async function loadWorkers() {
  try {
    const response = await fetch("/workers");
    const data = await response.json();

    if (data.success) {
      workers = data.workers;
      renderDeviceList();
    } else if (data.message && data.message.includes("login")) {
      window.location.href = "/";
    } else {
      showToast("Gagal memuat daftar perangkat", "error");
    }
  } catch (error) {
    console.error("Error loading workers:", error);
    showToast("Gagal terhubung ke server", "error");
  }
}

// ========================================
// RENDER DEVICE LIST
// ========================================
function renderDeviceList() {
  if (!deviceList) return;

  if (workers.length === 0) {
    deviceList.innerHTML = `
      <div class="no-devices">
        <p>📭 Belum ada perangkat yang terdaftar</p>
        <small style="color: #999;">Klik "Scan Network" untuk mencari perangkat otomatis</small>
        <br/>
        <small style="color: #666; display: block; margin-top: 10px;">
          atau tambahkan manual dengan IP address
        </small>
      </div>
    `;
    updateSelectedCount();
    return;
  }

  // Sort: online first, then manual, then discovered
  const sortedWorkers = [...workers].sort((a, b) => {
    if (a.status === "online" && b.status !== "online") return -1;
    if (a.status !== "online" && b.status === "online") return 1;
    if (a.manual && !b.manual) return -1;
    if (!a.manual && b.manual) return 1;
    return 0;
  });

  deviceList.innerHTML = sortedWorkers
    .map(
      (worker) => `
    <div class="device-item ${selectedWorkers.some((w) => w.id === worker.id) ? "selected" : ""}" data-id="${worker.id}">
      <div class="device-header">
        <span class="device-name">
          ${worker.manual ? "📌 " : "🔍 "}
          ${worker.name}
          ${worker.discovered ? ' <small style="color:#999;">(auto)</small>' : ""}
          ${worker.manual ? ' <small style="color:#4285f4;">(manual)</small>' : ""}
        </span>
        <span class="device-status ${worker.status}">${worker.status === "online" ? "🟢 Online" : "🔴 Offline"}</span>
      </div>
      <div class="device-ip">🌐 ${worker.ip}</div>
      <div class="device-actions">
        <div class="device-checkbox">
          <input 
            type="checkbox" 
            id="worker_${worker.id}" 
            ${selectedWorkers.some((w) => w.id === worker.id) ? "checked" : ""}
            ${worker.status !== "online" ? "disabled" : ""}
            data-id="${worker.id}"
          />
          <label for="worker_${worker.id}">Pilih perangkat ini</label>
        </div>
        ${
          worker.manual
            ? `
          <button class="btn-remove" data-id="${worker.id}">✕ Hapus</button>
        `
            : ""
        }
      </div>
    </div>
  `,
    )
    .join("");

  // Add event listeners
  document
    .querySelectorAll('.device-item input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.addEventListener("change", handleDeviceSelect);
    });

  document.querySelectorAll(".btn-remove").forEach((btn) => {
    btn.addEventListener("click", handleRemoveWorker);
  });

  updateSelectedCount();
}

// ========================================
// HANDLE DEVICE SELECT
// ========================================
function handleDeviceSelect(e) {
  const checkbox = e.target;
  const deviceId = checkbox.dataset.id;
  const worker = workers.find((w) => w.id === deviceId);

  if (!worker) return;

  if (checkbox.checked) {
    if (!selectedWorkers.some((w) => w.id === deviceId)) {
      selectedWorkers.push(worker);
    }
  } else {
    selectedWorkers = selectedWorkers.filter((w) => w.id !== deviceId);
  }

  updateSelectedCount();
  updateDeviceItems();

  const allCheckboxes = document.querySelectorAll(
    '.device-item input[type="checkbox"]:not(:disabled)',
  );
  const checkedCheckboxes = document.querySelectorAll(
    '.device-item input[type="checkbox"]:checked',
  );
  if (selectAll) {
    selectAll.checked =
      allCheckboxes.length > 0 &&
      allCheckboxes.length === checkedCheckboxes.length;
  }
}

// ========================================
// UPDATE UI
// ========================================
function updateSelectedCount() {
  const count = selectedWorkers.length;
  if (selectedCount) {
    selectedCount.textContent = `${count} perangkat dipilih`;
  }
}

function updateDeviceItems() {
  document.querySelectorAll(".device-item").forEach((item) => {
    const id = item.dataset.id;
    const isSelected = selectedWorkers.some((w) => w.id === id);
    item.classList.toggle("selected", isSelected);
  });
}

// ========================================
// SELECT ALL
// ========================================
if (selectAll) {
  selectAll.addEventListener("change", (e) => {
    const checked = e.target.checked;
    const onlineWorkers = workers.filter((w) => w.status === "online");

    if (checked) {
      selectedWorkers = [...onlineWorkers];
    } else {
      selectedWorkers = [];
    }

    document
      .querySelectorAll('.device-item input[type="checkbox"]:not(:disabled)')
      .forEach((checkbox) => {
        checkbox.checked = checked;
      });

    updateSelectedCount();
    updateDeviceItems();
  });
}

// ========================================
// DISCOVER WORKERS
// ========================================
if (discoverBtn) {
  discoverBtn.addEventListener("click", async () => {
    discoverBtn.disabled = true;
    discoverBtn.textContent = "⏳ Scanning...";
    showToast("🔍 Mencari perangkat di jaringan...", "info");

    try {
      const response = await fetch("/discover", {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        workers = data.workers;
        renderDeviceList();
        showToast(`✅ ${data.message}`, "success");
      } else {
        showToast("❌ " + data.message, "error");
      }
    } catch (error) {
      showToast("❌ Gagal melakukan discovery: " + error.message, "error");
    } finally {
      discoverBtn.disabled = false;
      discoverBtn.textContent = "🔍 Scan Network";
    }
  });
}

// ========================================
// ADD MANUAL WORKER
// ========================================
if (addWorkerBtn) {
  addWorkerBtn.addEventListener("click", async () => {
    const ip = manualIP.value.trim();
    const name = manualName.value.trim() || ip;

    if (!ip) {
      showToast("❌ Masukkan IP Address", "error");
      return;
    }

    // Validasi IP sederhana
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(ip)) {
      showToast("❌ Format IP tidak valid", "error");
      return;
    }

    try {
      const response = await fetch("/add-worker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip, name }),
      });

      const data = await response.json();

      if (data.success) {
        workers = data.workers;
        renderDeviceList();
        manualIP.value = "";
        manualName.value = "";
        showToast(`✅ ${data.message}`, "success");
      } else {
        showToast("❌ " + data.message, "error");
      }
    } catch (error) {
      showToast("❌ Gagal menambahkan worker: " + error.message, "error");
    }
  });

  // Enter key support
  manualIP.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addWorkerBtn.click();
    }
  });
  manualName.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addWorkerBtn.click();
    }
  });
}

// ========================================
// REMOVE WORKER
// ========================================
async function handleRemoveWorker(e) {
  const id = e.target.dataset.id;

  if (!confirm("Yakin ingin menghapus perangkat ini?")) return;

  try {
    const response = await fetch("/remove-worker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const data = await response.json();

    if (data.success) {
      workers = data.workers;
      renderDeviceList();
      showToast("✅ Perangkat berhasil dihapus", "success");
    } else {
      showToast("❌ " + data.message, "error");
    }
  } catch (error) {
    showToast("❌ Gagal menghapus: " + error.message, "error");
  }
}

// ========================================
// EXECUTE COMMAND
// ========================================
if (executeBtn) {
  executeBtn.addEventListener("click", async () => {
    const jumlah = parseInt(jumlahAkun.value);
    const url = targetUrl.value.trim();

    if (!jumlah || jumlah < 1) {
      showToast("❌ Masukkan jumlah akun yang valid", "error");
      return;
    }

    if (!url) {
      showToast("❌ Masukkan URL tujuan", "error");
      return;
    }

    if (selectedWorkers.length === 0) {
      showToast("❌ Pilih minimal 1 perangkat", "error");
      return;
    }

    let formattedUrl = url;
    if (
      !formattedUrl.startsWith("http://") &&
      !formattedUrl.startsWith("https://")
    ) {
      formattedUrl = "https://" + formattedUrl;
    }

    executeBtn.disabled = true;
    executeBtn.textContent = "⏳ Mengirim perintah...";
    resultContainer.style.display = "none";

    try {
      const response = await fetch("/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jumlah,
          url: formattedUrl,
          workers: selectedWorkers,
        }),
      });

      const data = await response.json();
      showResults(data);

      if (data.success) {
        showToast(
          `✅ Berhasil: ${data.success_count} dari ${data.total} perangkat`,
          "success",
        );
      } else {
        showToast("⚠️ Terjadi kesalahan", "error");
      }
    } catch (error) {
      console.error("Error executing command:", error);
      showToast("❌ Gagal mengirim perintah: " + error.message, "error");
    } finally {
      executeBtn.disabled = false;
      executeBtn.textContent = "🚀 Kirim Perintah";
    }
  });
}

// ========================================
// SHOW RESULTS
// ========================================
function showResults(data) {
  if (!resultContainer) return;

  resultContainer.style.display = "block";

  if (resultSummary) {
    resultSummary.innerHTML = `
      <span class="result-stat success">✅ Berhasil: ${data.success_count}</span>
      <span class="result-stat error">❌ Gagal: ${data.error_count}</span>
      <span class="result-stat" style="background:#e0e0e0;color:#333;">📊 Total: ${data.total}</span>
    `;
  }

  let detailHTML = "";

  if (data.results && data.results.length > 0) {
    detailHTML += data.results
      .map(
        (r) => `
      <div class="result-item" style="border-left: 3px solid #28a745; padding-left: 12px;">
        <span class="status-icon">✅</span>
        <strong>${r.worker}</strong> (${r.ip}): ${r.message}
      </div>
    `,
      )
      .join("");
  }

  if (data.errors && data.errors.length > 0) {
    detailHTML += data.errors
      .map(
        (e) => `
      <div class="result-item" style="border-left: 3px solid #dc3545; padding-left: 12px;">
        <span class="status-icon">❌</span>
        <strong>${e.worker}</strong> (${e.ip}): ${e.message}
      </div>
    `,
      )
      .join("");
  }

  if (resultDetail) {
    resultDetail.innerHTML =
      detailHTML || '<p style="color:#999;">Tidak ada detail</p>';
  }
}

// ========================================
// LOGOUT
// ========================================
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    if (confirm("Yakin ingin logout? Perangkat akan kembali menjadi Worker.")) {
      try {
        const response = await fetch("/logout", { method: "POST" });
        const data = await response.json();

        showToast("✅ " + data.message, "success");

        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } catch (error) {
        console.error("Logout error:", error);
        window.location.href = "/";
      }
    }
  });
}

// ========================================
// TOAST NOTIFICATION
// ========================================
function showToast(message, type = "info") {
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add("show");

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 5000);
}

// ========================================
// AUTO REFRESH
// ========================================
setInterval(() => {
  if (isLoggedIn) {
    loadWorkers();
  }
}, 15000);

// ========================================
// INIT
// ========================================
document.addEventListener("DOMContentLoaded", async () => {
  await checkSession();
});
