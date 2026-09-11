export async function apiRequest(apiUrl, payload) {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload),
    redirect: "follow"
  });

  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Response Apps Script bukan JSON valid: " + text.slice(0, 200));
  }
}
