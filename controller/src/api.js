export async function callApi(apiUrl, payload) {
  const response = await fetch(apiUrl, {
    method: "POST",

    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },

    body: JSON.stringify(payload),

    redirect: "follow",
  });

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    console.error(text);

    throw new Error("Response server bukan JSON valid.");
  }
}
