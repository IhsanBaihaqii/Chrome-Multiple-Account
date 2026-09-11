import { apiRequest } from "./lib/api.js";
import { getOrCreateDeviceId, getConfig, setLastSync } from "./lib/device.js";
import { executeCommand } from "./lib/commands.js";

const ALARM_NAME = "remote-sync";
const SYNC_MINUTES = 0.5; // 30 detik

chrome.runtime.onInstalled.addListener(async () => {
  await getOrCreateDeviceId();
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: SYNC_MINUTES });
  await syncNow();
});

chrome.runtime.onStartup.addListener(async () => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: SYNC_MINUTES });
  await syncNow();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await syncNow();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "SYNC_NOW") {
    syncNow()
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function syncNow() {
  const config = await getConfig();
  if (!config.apiUrl || !config.deviceName || !config.profileName || !config.workerToken) {
    return { success: false, error: "Konfigurasi extension belum lengkap." };
  }

  const deviceId = await getOrCreateDeviceId();

  const payload = {
    action: "sync",
    deviceId,
    token: config.workerToken,
    device: {
      name: config.deviceName,
      profile: config.profileName,
      group: config.deviceGroup || "",
      extensionVersion: chrome.runtime.getManifest().version
    }
  };

  const response = await apiRequest(config.apiUrl, payload);
  await setLastSync(new Date().toISOString());

  if (!response?.success) return response;

  const commands = Array.isArray(response.commands) ? response.commands : [];
  const results = [];

  for (const command of commands) {
    try {
      const result = await executeCommand(command);
      results.push({
        commandId: command.commandId,
        success: true,
        result
      });
    } catch (error) {
      results.push({
        commandId: command.commandId,
        success: false,
        error: error.message
      });
    }
  }

  if (results.length > 0) {
    await apiRequest(config.apiUrl, {
      action: "submitResults",
      deviceId,
      token: config.workerToken,
      results
    });
  }

  return { success: true, commands: commands.length, results };
}
