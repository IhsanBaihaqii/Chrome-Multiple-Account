// ========================================
// DASHBOARD LOGIC
// ========================================
let workers = [];
let selectedWorkers = [];

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
        <small style="color: #999;">Pastikan perangkat worker sudah dijalankan dan terdaftar</small>
      </div>
    `;
    updateSelectedCount();
    return;
  }

  // Sort: online first
  const sortedWorkers = [...workers].sort((a, b) => {
    if (a.status === "online" && b.status !== "online") return -1;
    if (a.status !== "online" && b.status === "online") return 1;
    return 0;
  });

  deviceList.innerHTML = sortedWorkers
    .map(
      (worker) => `
    <div class="device-item ${selectedWorkers.some((w) => w.id === worker.id) ? "selected" : ""}" data-id="${worker.id}">
      <div class="device-header">
        <span class="device-name">${worker.name}</span>
        <span class="device-status ${worker.status}">${worker.status === "online" ? "🟢 Online" : "🔴 Offline"}</span>
      </div>
      <div class="device-ip">🌐 ${worker.ip}</div>
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
    </div>
  `,
    )
    .join("");

  // Add event listeners to checkboxes
  document
    .querySelectorAll('.device-item input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.addEventListener("change", handleDeviceSelect);
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

  // Update UI
  updateSelectedCount();
  updateDeviceItems();

  // Update select all
  const allCheckboxes = document.querySelectorAll(
    '.device-item input[type="checkbox"]:not(:disabled)',
  );
  const checkedCheckboxes = document.querySelectorAll(
    '.device-item input[type="checkbox"]:checked',
  );
  selectAll.checked =
    allCheckboxes.length > 0 &&
    allCheckboxes.length === checkedCheckboxes.length;
}

// ========================================
// UPDATE UI
// ========================================
function updateSelectedCount() {
  const count = selectedWorkers.length;
  selectedCount.textContent = `${count} perangkat dipilih`;
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
selectAll.addEventListener("change", (e) => {
  const checked = e.target.checked;

  // Select/deselect all online workers
  const onlineWorkers = workers.filter((w) => w.status === "online");

  if (checked) {
    selectedWorkers = [...onlineWorkers];
  } else {
    selectedWorkers = [];
  }

  // Update checkboxes
  document
    .querySelectorAll('.device-item input[type="checkbox"]:not(:disabled)')
    .forEach((checkbox) => {
      checkbox.checked = checked;
    });

  updateSelectedCount();
  updateDeviceItems();
});

// ========================================
// EXECUTE COMMAND
// ========================================
executeBtn.addEventListener("click", async () => {
  const jumlah = parseInt(jumlahAkun.value);
  const url = targetUrl.value.trim();

  // Validasi
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

  // Format URL
  let formattedUrl = url;
  if (
    !formattedUrl.startsWith("http://") &&
    !formattedUrl.startsWith("https://")
  ) {
    formattedUrl = "https://" + formattedUrl;
  }

  // Disable button
  executeBtn.disabled = true;
  executeBtn.textContent = "⏳ Mengirim perintah...";

  // Clear previous results
  resultContainer.style.display = "none";

  try {
    const response = await fetch("/control", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jumlah,
        url: formattedUrl,
        workers: selectedWorkers,
      }),
    });

    const data = await response.json();

    // Show results
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

// ========================================
// SHOW RESULTS
// ========================================
function showResults(data) {
  resultContainer.style.display = "block";

  // Summary
  resultSummary.innerHTML = `
    <span class="result-stat success">✅ Berhasil: ${data.success_count}</span>
    <span class="result-stat error">❌ Gagal: ${data.error_count}</span>
    <span class="result-stat" style="background:#e0e0e0;color:#333;">📊 Total: ${data.total}</span>
  `;

  // Detail
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

  resultDetail.innerHTML =
    detailHTML || '<p style="color:#999;">Tidak ada detail</p>';
}

// ========================================
// LOGOUT
// ========================================
logoutBtn.addEventListener("click", async () => {
  if (confirm("Yakin ingin logout?")) {
    try {
      await fetch("/logout", { method: "POST" });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/";
    }
  }
});

// ========================================
// TOAST NOTIFICATION
// ========================================
function showToast(message, type = "info") {
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
// Refresh worker list every 10 seconds
setInterval(loadWorkers, 10000);

// ========================================
// INIT
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  loadWorkers();

  // Set default device name
  fetch("/status")
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("controllerName").textContent =
        data.device || "Unknown";
    })
    .catch(console.error);
});
