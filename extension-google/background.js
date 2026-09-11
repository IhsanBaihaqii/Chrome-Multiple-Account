import { CONFIG } from "./config.js";
import { apiRequest } from "./lib/api.js";
import { getDeviceInfo, setLastSync } from "./lib/device.js";
import { executeCommand } from "./lib/commands.js";

const ALARM_NAME = "remote-sync";

chrome.runtime.onInstalled.addListener(async () => {
  console.log("Remote Chrome Worker installed");

  await getDeviceInfo();

  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: CONFIG.SYNC_MINUTES,
  });

  await syncNow();
});

chrome.runtime.onStartup.addListener(async () => {
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: CONFIG.SYNC_MINUTES,
  });

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
      .then(sendResponse)
      .catch((error) => {
        sendResponse({
          success: false,
          error: error.message,
        });
      });

    return true;
  }

  if (message?.type === "GET_STATUS") {
    getStatus()
      .then(sendResponse)
      .catch((error) => {
        sendResponse({
          success: false,
          error: error.message,
        });
      });

    return true;
  }
});

async function syncNow() {
  try {
    const device = await getDeviceInfo();

    const response = await apiRequest(CONFIG.API_URL, {
      action: "sync",

      deviceId: device.deviceId,

      token: CONFIG.WORKER_TOKEN,

      device: {
        name: device.deviceName,
        profile: device.profileName,
        group: "",
        extensionVersion: chrome.runtime.getManifest().version,
      },
    });

    await setLastSync(new Date().toISOString());

    if (!response?.success) {
      console.error("Sync gagal:", response);

      return response;
    }

    const commands = Array.isArray(response.commands) ? response.commands : [];

    const results = [];

    for (const command of commands) {
      try {
        const result = await executeCommand(command);

        results.push({
          commandId: command.commandId,
          success: true,
          result,
        });
      } catch (error) {
        results.push({
          commandId: command.commandId,
          success: false,
          error: error.message,
        });
      }
    }

    if (results.length > 0) {
      await apiRequest(CONFIG.API_URL, {
        action: "submitResults",

        deviceId: device.deviceId,

        token: CONFIG.WORKER_TOKEN,

        results,
      });
    }

    return {
      success: true,
      device,
      commandCount: commands.length,
      results,
    };
  } catch (error) {
    console.error("SYNC ERROR:", error);

    return {
      success: false,
      error: error.message,
    };
  }
}

async function getStatus() {
  const device = await getDeviceInfo();

  const storage = await chrome.storage.local.get(["lastSync"]);

  return {
    success: true,

    deviceId: device.deviceId,

    deviceName: device.deviceName,

    profileName: device.profileName,

    lastSync: storage.lastSync || "",

    apiUrl: CONFIG.API_URL,
  };
}
