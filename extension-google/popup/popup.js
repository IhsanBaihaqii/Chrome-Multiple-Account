async function loadStatus() {
  const data = await chrome.runtime.sendMessage({
    type: "GET_STATUS",
  });

  if (!data?.success) {
    document.getElementById("status").textContent = data?.error || "Error";

    return;
  }

  document.getElementById("deviceName").textContent = data.deviceName;

  document.getElementById("deviceId").textContent = data.deviceId;

  document.getElementById("lastSync").textContent =
    data.lastSync || "Belum sync";

  document.getElementById("status").textContent = "Connected";
}

document.getElementById("sync").addEventListener("click", async () => {
  document.getElementById("status").textContent = "Sync...";

  const result = await chrome.runtime.sendMessage({
    type: "SYNC_NOW",
  });

  if (result?.success) {
    document.getElementById("status").textContent = "Connected";

    await loadStatus();
  } else {
    document.getElementById("status").textContent =
      result?.error || "Sync gagal";
  }
});

loadStatus();
