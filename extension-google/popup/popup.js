import { getConfig, getOrCreateDeviceId } from "../lib/device.js";

async function load() {
  const config = await getConfig();
  const id = await getOrCreateDeviceId();

  document.getElementById("device").textContent = config.deviceName || "-";
  document.getElementById("profile").textContent = config.profileName || "-";
  document.getElementById("lastSync").textContent = config.lastSync || "-";
  document.getElementById("deviceId").textContent = "ID: " + id;
}

document.getElementById("syncBtn").addEventListener("click", async () => {
  const status = document.getElementById("status");
  status.textContent = "Sync...";
  status.className = "row";

  const result = await chrome.runtime.sendMessage({ type: "SYNC_NOW" });

  if (result?.success) {
    status.textContent = `Berhasil. Command: ${result.commands || 0}`;
    status.className = "row ok";
  } else {
    status.textContent = result?.error || "Gagal";
    status.className = "row bad";
  }

  await load();
});

load();
