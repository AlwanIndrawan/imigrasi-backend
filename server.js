const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   GEMINI API (CHAT AI)
========================= */
app.post("/chat", async (req, res) => {

  try {

    const userText = req.body.message;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `Anda adalah pegawai pada Kantor Wilayah Direktorat Jenderal Imigrasi Sulawesi Selatan.
Tugas Anda memberikan informasi layanan keimigrasian secara singkat, jelas, dan langsung ke inti.

Gunakan bahasa yang sopan, profesional, dan mudah dipahami.
Hindari penggunaan simbol seperti *, tanda pagar, atau format poin.
Jawaban disusun dalam kalimat biasa, bukan daftar.

Tidak perlu menggunakan sapaan waktu seperti selamat pagi, siang, atau sore.
Tidak perlu menggunakan kata sapaan seperti bapak atau ibu.
Gunakan kalimat netral dan langsung ke informasi.

Jika informasi tidak tersedia atau kurang jelas, arahkan untuk menghubungi petugas terkait.

Pertanyaan:
${userText}`
          }]
        }]
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const reply =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Maaf, jawaban tidak tersedia.";

    res.json({ reply });

  } catch (error) {

    console.log("ERROR GEMINI:");
    console.log(error.response?.data || error.message);

    res.json({
      reply: "asisten sedang mengalami gangguan, terima kasih."
    });

  }

});


/* =========================
   ELEVENLABS (TEXT TO SPEECH)
========================= */
app.post("/tts-eleven", async (req, res) => {

  try {

    const text = req.body.text;

    const response = await axios({
      method: "POST",
      url: `https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE_ID}`,
      headers: {
        "xi-api-key": process.env.ELEVEN_API_KEY,
        "Content-Type": "application/json"
      },
      data: {
        text: text,
        model_id: "eleven_multilingual_v2"
      },
      responseType: "arraybuffer"
    });

    const contentType = response.headers["content-type"];

    if (!contentType || !contentType.includes("audio")) {
      console.log("❌ Bukan audio dari Eleven:");
      console.log(response.data.toString());

      return res.status(500).json({
        error: "TTS gagal"
      });
    }

    res.set({
      "Content-Type": "audio/mpeg"
    });

    res.send(response.data);

  } catch (error) {

    console.log("❌ ERROR ELEVEN:");
    console.log(error.response?.data?.toString() || error.message);

    res.status(500).json({
      error: "TTS gagal"
    });

  }

});


/* =========================
   SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server jalan di http://localhost:" + PORT);
});
