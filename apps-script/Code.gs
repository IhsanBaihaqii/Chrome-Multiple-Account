function doGet(e) {
  return jsonOutput({
    success: true,
    service: "Remote Chrome Controller API",
    time: new Date().toISOString()
  });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    const action = body.action || "";

    if (action === "sync") return jsonOutput(syncWorker(body));
    if (action === "submitResults") return jsonOutput(submitResults(body));

    if (action === "getDevices") {
      assertController(body.token);
      return jsonOutput({ success: true, devices: getDevices() });
    }

    if (action === "createCommands") {
      assertController(body.token);
      return jsonOutput(createCommands(body));
    }

    return jsonOutput({ success: false, error: "Action tidak dikenal: " + action });
  } catch (err) {
    return jsonOutput({
      success: false,
      error: String(err.message || err)
    });
  }
}
