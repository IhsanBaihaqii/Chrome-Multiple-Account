function syncWorker(body) {
  assertWorker(body.token);

  const deviceId = String(body.deviceId || "").trim();
  if (!deviceId) throw new Error("deviceId wajib.");

  const device = body.device || {};
  const now = new Date();

  upsertDevice_({
    deviceId,
    deviceName: device.name || "Unknown Device",
    profileName: device.profile || "Unknown Profile",
    groupName: device.group || "",
    workerToken: body.token,
    extensionVersion: device.extensionVersion || "",
    status: "online",
    lastSeen: now
  });

  const commands = getPendingCommandsForDevice_(deviceId, now);

  logEvent_(deviceId, "SYNC", {
    commandCount: commands.length
  });

  return {
    success: true,
    commands
  };
}

function getDevices() {
  const sheet = getSheet_(CONFIG.SHEETS.DEVICES);
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) return [];

  const now = new Date();

  return values.slice(1)
    .filter(row => row[0])
    .map(row => {
      const lastSeen = row[7] ? new Date(row[7]) : null;
      const seconds = lastSeen ? Math.floor((now - lastSeen) / 1000) : 999999;
      const status = seconds <= CONFIG.ONLINE_THRESHOLD_SECONDS ? "online" : "offline";

      return {
        deviceId: row[0],
        deviceName: row[1],
        profileName: row[2],
        group: row[3],
        extensionVersion: row[5],
        status,
        lastSeen: lastSeen ? lastSeen.toISOString() : ""
      };
    });
}

function upsertDevice_(d) {
  const sheet = getSheet_(CONFIG.SHEETS.DEVICES);
  const values = sheet.getDataRange().getValues();

  let rowIndex = -1;

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === d.deviceId) {
      rowIndex = i + 1;
      break;
    }
  }

  const row = [
    d.deviceId,
    d.deviceName,
    d.profileName,
    d.groupName,
    d.workerToken,
    d.extensionVersion,
    d.status,
    d.lastSeen,
    rowIndex === -1 ? new Date() : values[rowIndex - 1][8]
  ];

  if (rowIndex === -1) {
    sheet.appendRow(row);
  } else {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  }
}
