const openBtn = document.getElementById("openBtn");

const jumlahInput = document.getElementById("jumlah");

const urlInput = document.getElementById("url");

const message = document.getElementById("message");

openBtn.addEventListener("click", async () => {
  const jumlah = parseInt(jumlahInput.value);

  let url = urlInput.value.trim();

  if (!jumlah || jumlah < 1) {
    message.textContent = "Masukkan jumlah akun.";

    return;
  }

  if (!url) {
    message.textContent = "Masukkan URL tujuan.";

    return;
  }

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  try {
    const response = await fetch("/open", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        jumlah,
        url,
      }),
    });

    const data = await response.json();

    message.textContent = data.message;
  } catch (error) {
    message.textContent = "Terjadi kesalahan.";

    console.error(error);
  }
});
