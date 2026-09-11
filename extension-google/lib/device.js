export async function getOrCreateDeviceId() {
  const current = await chrome.storage.local.get(["deviceId"]);
  if (current.deviceId) return current.deviceId;

  const deviceId = crypto.randomUUID();
  await chrome.storage.local.set({ deviceId });
  return deviceId;
}

export async function getConfig() {
  const data = await chrome.storage.local.get([
    "apiUrl",
    "deviceName",
    "profileName",
    "deviceGroup",
    "workerToken",
    "lastSync"
  ]);

  return {
    apiUrl: data.apiUrl || "",
    deviceName: data.deviceName || "",
    profileName: data.profileName || "",
    deviceGroup: data.deviceGroup || "",
    workerToken: data.workerToken || "",
    lastSync: data.lastSync || ""
  };
}

export async function setLastSync(value) {
  await chrome.storage.local.set({ lastSync: value });
}
