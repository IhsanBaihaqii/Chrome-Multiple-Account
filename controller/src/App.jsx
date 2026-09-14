import { useEffect, useState } from "react";

import { callApi } from "./api.js";

const API_URL = import.meta.env.VITE_API_URL;

const CONTROLLER_TOKEN = import.meta.env.VITE_CONTROLLER_TOKEN;

export default function App() {
  const [url, setUrl] = useState("https://tiktok.com/@ihsanbaihaqii_");

  const [devices, setDevices] = useState([]);

  const [selected, setSelected] = useState([]);

  const [result, setResult] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDevices();
  }, []);

  async function loadDevices() {
    setLoading(true);

    try {
      const data = await callApi(API_URL, {
        action: "getDevices",

        token: CONTROLLER_TOKEN,
      });

      if (!data.success) {
        setDevices([]);

        setResult(data.error || "Gagal mengambil devices.");

        return;
      }

      setDevices(data.devices || []);
    } catch (error) {
      setResult("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleDevice(id) {
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }

  function selectAll() {
    setSelected(devices.map((device) => device.deviceId));
  }

  function selectOnline() {
    setSelected(
      devices
        .filter((device) => device.status === "online")
        .map((device) => device.deviceId),
    );
  }

  function clearSelection() {
    setSelected([]);
  }

  async function sendCommand(command) {
    if (selected.length === 0) {
      alert("Pilih minimal 1 worker.");

      return;
    }

    const payload = {};

    if (command === "OPEN_TAB") {
      if (!url.trim()) {
        alert("URL tidak boleh kosong.");

        return;
      }

      payload.url = url.trim();

      payload.active = true;
    }

    try {
      const data = await callApi(API_URL, {
        action: "createCommands",

        token: CONTROLLER_TOKEN,

        targets: selected,

        command,

        payload,

        expiresInMinutes: 5,
      });

      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(
        JSON.stringify(
          {
            success: false,
            error: error.message,
          },
          null,
          2,
        ),
      );
    }
  }

  return (
    <main className="container">
      <section className="card">
        <h1>Remote Chrome Controller</h1>

        <p>Apps Script sudah dikonfigurasi otomatis.</p>

        <button onClick={loadDevices} disabled={loading}>
          {loading ? "Loading..." : "Refresh Devices"}
        </button>
      </section>

      <section className="card">
        <h2>Devices</h2>

        <div className="actions">
          <button onClick={selectAll}>Select All</button>

          <button onClick={selectOnline}>Select Online</button>

          <button onClick={clearSelection}>Clear</button>
        </div>

        {devices.length === 0 ? (
          <div>Belum ada worker.</div>
        ) : (
          devices.map((device) => (
            <div className="device" key={device.deviceId}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(device.deviceId)}
                  onChange={() => toggleDevice(device.deviceId)}
                />

                <b>{device.deviceName}</b>

                {" / "}

                {device.profileName}
              </label>

              <div
                className={device.status === "online" ? "online" : "offline"}
              >
                {device.status}
              </div>

              <small>{device.lastSeen}</small>
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
