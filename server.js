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
      // MENGGUNAKAN FLASH-LITE UNTUK LIMIT YANG LEBIH BESAR
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        // PINDAHKAN INSTRUKSI KE SINI
        system_instruction: {
          parts: [{
            text: `Anda adalah pegawai pada Kantor Wilayah Direktorat Jenderal Imigrasi Sulawesi Selatan. 
            Tugas: Memberikan informasi tentang keimigrasian singkat, jelas, langsung ke inti.
            Aturan Ketat: 
            - Gunakan bahasa sopan & profesional.
            - Dilarang keras menggunakan simbol (*, #, poin-poin).
            - Susun dalam kalimat biasa/paragraf tunggal.
            - Tanpa sapaan waktu (pagi/siang) dan tanpa sapaan Bapak/Ibu.
            - Jika info tidak ada, arahkan ke petugas terkait.`
          }]
        },
        contents: [{
          role: "user",
          parts: [{ text: userText }]
        }]
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, jawaban tidak tersedia.";
    res.json({ reply });

  } catch (error) {
    console.log("ERROR GEMINI:");
    // Cek jika error 429 (Limit)
    if (error.response?.status === 429) {
        return res.json({ reply: "Maaf, layanan sedang padat. Silakan coba sesaat lagi." });
    }
    console.log(error.response?.data || error.message);
    res.json({ reply: "Asisten sedang mengalami gangguan, terima kasih." });
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
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      responseType: "arraybuffer"
    });

    // VALIDASI RESPONSE AUDIO
    const contentType = response.headers["content-type"];

    if (!contentType || !contentType.includes("audio")) {
      console.log("❌ Response bukan audio:");
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
