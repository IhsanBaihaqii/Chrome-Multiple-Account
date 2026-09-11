import { getConfig, getOrCreateDeviceId } from "../lib/device.js";

async function load() {
  const config = await getConfig();
  const deviceId = await getOrCreateDeviceId();

  for (const key of ["apiUrl","deviceName","profileName","deviceGroup","workerToken"]) {
    document.getElementById(key).value = config[key] || "";
  }

  document.getElementById("deviceId").textContent = deviceId;
}

document.getElementById("saveBtn").addEventListener("click", async () => {
  const data = {};
  for (const key of ["apiUrl","deviceName","profileName","deviceGroup","workerToken"]) {
    data[key] = document.getElementById(key).value.trim();
  }

  await chrome.storage.local.set(data);
  document.getElementById("status").textContent = "Pengaturan tersimpan.";
});

load();
