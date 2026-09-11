import { useState } from "react";
import { callApi } from "./api.js";

export default function App() {
  const [apiUrl, setApiUrl] = useState("");
  const [token, setToken] = useState("");
  const [url, setUrl] = useState("https://tiktok.com/@ihsanbaihaqi");
  const [devices, setDevices] = useState([]);
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadDevices() {
    setLoading(true);
    try {
      const data = await callApi(apiUrl, { action: "getDevices", token });
      if (!data.success) {
        setDevices([]);
        setResult(data.error || "Gagal mengambil devices.");
        return;
      }
      setDevices(data.devices);
    } catch (e) {
      setResult("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleDevice(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function sendCommand(command) {
    if (!selected.length) {
      alert("Pilih minimal 1 device/profile.");
      return;
    }
    const payload = {};
    if (command === "OPEN_TAB") {
      payload.url = url;
      payload.active = true;
    }
    const data = await callApi(apiUrl, {
      action: "createCommands",
      token,
      targets: selected,
      command,
      payload,
      expiresInMinutes: 5,
    });
    setResult(JSON.stringify(data, null, 2));
  }

  return (
    <main className="container">
      <section className="card">
        <h1>Remote Chrome Controller</h1>

        <div className="grid">
          <div>
            <label>Apps Script Web App URL</label>
            <input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
            />
          </div>
          <div>
            <label>Controller token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="controller-secret-token"
            />
          </div>
        </div>

        <button onClick={loadDevices} disabled={loading}>
          {loading ? "Loading..." : "Load Devices"}
        </button>
      </section>

      <section className="card">
        <h2>Devices</h2>
        {devices.length === 0 ? (
          <div>Belum dimuat.</div>
        ) : (
          devices.map((d) => (
            <div className="device" key={d.deviceId}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(d.deviceId)}
                  onChange={() => toggleDevice(d.deviceId)}
                />
                <b>{d.deviceName}</b> / {d.profileName}
              </label>
              <div>{d.group || "-"}</div>
              <div className={d.status === "online" ? "online" : "offline"}>
                {d.status}
              </div>
              <small>{d.lastSeen || ""}</small>
            </div>
          ))
        )}
      </section>

      <section className="card">
        <h2>Kirim Command</h2>

        <label>URL</label>
        <input value={url} onChange={(e) => setUrl(e.target.value)} />

        <div className="actions">
          <button onClick={() => sendCommand("OPEN_TAB")}>Open URL</button>
          <button onClick={() => sendCommand("LIST_TABS")}>List Tabs</button>
          <button onClick={() => sendCommand("CLOSE_ALL_MANAGED")}>
            Close Managed Tabs
          </button>
        </div>

        <pre>{result}</pre>
      </section>
    </main>
  );
}
