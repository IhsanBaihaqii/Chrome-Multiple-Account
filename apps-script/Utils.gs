function getSheet_(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) {
    throw new Error("Sheet " + name + " tidak ditemukan. Jalankan setupSpreadsheet() terlebih dahulu.");
  }
  return sheet;
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function parseJsonSafe_(value, fallback) {
  try {
    return JSON.parse(value || "");
  } catch (_) {
    return fallback;
  }
}

function logEvent_(deviceId, eventName, data) {
  const sheet = getSheet_(CONFIG.SHEETS.LOGS);
  sheet.appendRow([
    Utilities.getUuid(),
    deviceId || "",
    eventName,
    JSON.stringify(data || {}),
    new Date()
  ]);
}
