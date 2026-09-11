export async function getDeviceInfo() {
  const data = await chrome.storage.local.get([
    "deviceId",
    "deviceName",
    "profileName",
    "createdAt",
  ]);

  if (data.deviceId) {
    return {
      deviceId: data.deviceId,
      deviceName: data.deviceName,
      profileName: data.profileName,
      createdAt: data.createdAt,
    };
  }

  const deviceId = crypto.randomUUID();

  const shortId = deviceId.replaceAll("-", "").substring(0, 8).toUpperCase();

  const deviceName = `Worker-${shortId}`;
  const profileName = `Profile-${shortId}`;

  const createdAt = new Date().toISOString();

  await chrome.storage.local.set({
    deviceId,
    deviceName,
    profileName,
    createdAt,
  });

  return {
    deviceId,
    deviceName,
    profileName,
    createdAt,
  };
}

export async function setLastSync(value) {
  await chrome.storage.local.set({
    lastSync: value,
  });
}

export async function getLastSync() {
  const data = await chrome.storage.local.get(["lastSync"]);
  return data.lastSync || "";
}
