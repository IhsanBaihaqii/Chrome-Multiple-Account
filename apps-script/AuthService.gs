function assertController(token) {
  if (!token || token !== CONFIG.CONTROLLER_TOKEN) {
    throw new Error("Controller token tidak valid.");
  }
}

function assertWorker(token) {
  if (!token || token !== CONFIG.WORKER_TOKEN) {
    throw new Error("Worker token tidak valid.");
  }
}
