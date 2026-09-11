function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  createOrResetSheet_(ss, CONFIG.SHEETS.DEVICES, [
    "device_id",
    "device_name",
    "profile_name",
    "group_name",
    "worker_token",
    "extension_version",
    "status",
    "last_seen",
    "created_at"
  ]);

  createOrResetSheet_(ss, CONFIG.SHEETS.COMMANDS, [
    "command_id",
    "target_device",
    "command",
    "payload_json",
    "status",
    "created_at",
    "started_at",
    "completed_at",
    "expires_at"
  ]);

  createOrResetSheet_(ss, CONFIG.SHEETS.RESULTS, [
    "result_id",
    "command_id",
    "device_id",
    "success",
    "message",
    "result_json",
    "created_at"
  ]);

  createOrResetSheet_(ss, CONFIG.SHEETS.LOGS, [
    "log_id",
    "device_id",
    "event",
    "data_json",
    "created_at"
  ]);

  SpreadsheetApp.getUi().alert("Setup selesai. Sheet DEVICES, COMMANDS, RESULTS, LOGS sudah dibuat.");
}

function createOrResetSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  } else {
    sheet.clear();
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}
