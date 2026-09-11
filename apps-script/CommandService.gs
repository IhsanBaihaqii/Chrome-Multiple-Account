function createCommands(body) {
  const targets = Array.isArray(body.targets) ? body.targets : [];
  if (!targets.length) throw new Error("targets kosong.");

  const command = String(body.command || "").trim();
  if (!command) throw new Error("command kosong.");

  const payload = body.payload || {};
  const expiresMinutes = Number(body.expiresInMinutes || CONFIG.DEFAULT_COMMAND_EXPIRE_MINUTES);

  const sheet = getSheet_(CONFIG.SHEETS.COMMANDS);
  const created = [];

  targets.forEach(deviceId => {
    const now = new Date();
    const expires = new Date(now.getTime() + expiresMinutes * 60 * 1000);
    const commandId = Utilities.getUuid();

    sheet.appendRow([
      commandId,
      deviceId,
      command,
      JSON.stringify(payload),
      "pending",
      now,
      "",
      "",
      expires
    ]);

    created.push({ commandId, deviceId });
  });

  return {
    success: true,
    created
  };
}

function getPendingCommandsForDevice_(deviceId, now) {
  const sheet = getSheet_(CONFIG.SHEETS.COMMANDS);
  const values = sheet.getDataRange().getValues();
  const result = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];

    const commandId = row[0];
    const targetDevice = String(row[1]);
    const command = String(row[2]);
    const payloadJson = row[3];
    const status = String(row[4]);
    const expiresAt = row[8] ? new Date(row[8]) : null;

    if (!commandId || targetDevice !== deviceId) continue;
    if (status !== "pending") continue;

    if (expiresAt && now > expiresAt) {
      sheet.getRange(i + 1, 5).setValue("expired");
      continue;
    }

    sheet.getRange(i + 1, 5).setValue("processing");
    sheet.getRange(i + 1, 7).setValue(now);

    result.push({
      commandId,
      command,
      payload: parseJsonSafe_(payloadJson, {})
    });
  }

  return result;
}

function submitResults(body) {
  assertWorker(body.token);

  const deviceId = String(body.deviceId || "");
  const results = Array.isArray(body.results) ? body.results : [];
  const resultsSheet = getSheet_(CONFIG.SHEETS.RESULTS);
  const commandsSheet = getSheet_(CONFIG.SHEETS.COMMANDS);

  const commandValues = commandsSheet.getDataRange().getValues();

  results.forEach(item => {
    const success = !!item.success;

    resultsSheet.appendRow([
      Utilities.getUuid(),
      item.commandId || "",
      deviceId,
      success,
      success ? "OK" : String(item.error || "FAILED"),
      JSON.stringify(item.result || {}),
      new Date()
    ]);

    for (let i = 1; i < commandValues.length; i++) {
      if (String(commandValues[i][0]) === String(item.commandId)) {
        commandsSheet.getRange(i + 1, 5).setValue(success ? "completed" : "failed");
        commandsSheet.getRange(i + 1, 8).setValue(new Date());
        break;
      }
    }
  });

  logEvent_(deviceId, "RESULTS_SUBMITTED", {
    count: results.length
  });

  return {
    success: true,
    count: results.length
  };
}
