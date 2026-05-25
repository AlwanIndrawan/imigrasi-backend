const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   FAQ / STATIC ANSWERS
========================= */
const faqList = [
  {
    keywords: ["buat paspor", "membuat paspor", "cara paspor", "bikin paspor", "pembuatan paspor", "daftar paspor"],
    answer: `Untuk membuat paspor, Anda perlu menyiapkan dokumen berikut: KTP asli dan fotokopi, Kartu Keluarga (KK), dan Akta Kelahiran atau Ijazah. Pendaftaran dapat dilakukan secara online melalui aplikasi M-Paspor, lalu pilih kantor imigrasi terdekat dan jadwal yang tersedia. Biaya pembuatan paspor biasa (48 halaman) adalah Rp 350.000, sedangkan paspor elektronik (e-paspor) Rp 650.000. Setelah mendaftar, Anda datang ke kantor imigrasi untuk verifikasi dokumen, foto, dan pengambilan sidik jari. Paspor siap dalam 3 hingga 4 hari kerja.`
  },
  {
    keywords: ["perpanjang paspor", "memperpanjang paspor", "renewal paspor", "paspor habis", "paspor expired"],
    answer: `Perpanjangan paspor dilakukan ketika masa berlaku paspor kurang dari 6 bulan atau sudah habis. Dokumen yang diperlukan adalah paspor lama, KTP asli dan fotokopi, serta Kartu Keluarga. Prosesnya sama dengan pembuatan baru, yaitu mendaftar melalui aplikasi M-Paspor, datang ke kantor imigrasi, dan menjalani proses foto serta sidik jari. Biaya perpanjangan sama dengan pembuatan baru.`
  },
  {
    keywords: ["biaya paspor", "harga paspor", "tarif paspor", "berapa paspor"],
    answer: `Biaya pembuatan paspor biasa 48 halaman adalah Rp 350.000, sedangkan paspor elektronik (e-paspor) 48 halaman adalah Rp 650.000. Biaya ini belum termasuk biaya layanan percepatan jika Anda memilih layanan prioritas.`
  },
  {
    keywords: ["visa", "cara visa", "buat visa", "pengajuan visa"],
    answer: `Pengurusan visa tergantung pada negara tujuan Anda. Untuk visa kunjungan ke negara tertentu, Anda bisa mengajukan melalui kedutaan besar negara tujuan atau secara online jika negara tersebut menyediakan e-Visa. Kantor Imigrasi tidak menerbitkan visa untuk keluar negeri, namun kami dapat membantu informasi terkait izin tinggal bagi WNA di Indonesia. Silakan hubungi petugas kami untuk informasi lebih lanjut.`
  },
  {
    keywords: ["izin tinggal", "kitas", "kitap", "izin tinggal wna", "kartu izin tinggal"],
    answer: `KITAS (Kartu Izin Tinggal Terbatas) diberikan kepada WNA yang tinggal sementara di Indonesia untuk keperluan bekerja, belajar, atau menyusul keluarga. KITAP (Kartu Izin Tinggal Tetap) diberikan kepada WNA yang telah tinggal lama dan memenuhi syarat tertentu. Pengajuan dapat dilakukan di Kantor Imigrasi dengan membawa dokumen seperti paspor, sponsor letter, dan dokumen pendukung lainnya.`
  },
  {
    keywords: ["jam buka", "jam operasional", "jam kerja", "buka jam", "tutup jam", "waktu pelayanan"],
    answer: `Kantor Wilayah Direktorat Jenderal Imigrasi Sulawesi Selatan melayani masyarakat pada hari Senin hingga Jumat, pukul 08.00 hingga 16.00 WITA.`
  },
  {
    keywords: ["alamat kantor", "lokasi kantor", "dimana kantor", "kantor imigrasi makassar", "alamat imigrasi"],
    answer: `Kantor Wilayah Direktorat Jenderal Imigrasi Sulawesi Selatan berlokasi di Jalan Perintis Kemerdekaan, Makassar, Sulawesi Selatan. Untuk informasi lebih lanjut, Anda dapat menghubungi kami melalui nomor telepon yang tertera di website resmi imigrasi.`
  },
  {
    keywords: ["m-paspor", "aplikasi paspor", "daftar online paspor", "antrian paspor online"],
    answer: `M-Paspor adalah aplikasi resmi Ditjen Imigrasi untuk pendaftaran pembuatan dan perpanjangan paspor secara online. Anda dapat mengunduh aplikasi M-Paspor melalui Google Play Store atau App Store. Setelah mendaftar, pilih kantor imigrasi, jadwal kedatangan, lalu unggah dokumen yang diperlukan. Datang ke kantor imigrasi sesuai jadwal untuk proses selanjutnya.`
  }
];

// Fungsi pencocokan keyword
function findFaqAnswer(userText) {
  const normalizedInput = userText.toLowerCase().trim();

  for (const faq of faqList) {
    for (const keyword of faq.keywords) {
      if (normalizedInput.includes(keyword.toLowerCase())) {
        return faq.answer;
      }
    }
  }

  return null; // Tidak ada yang cocok → pakai Gemini
}

/* =========================
   GEMINI API (CHAT AI)
========================= */
app.post("/chat", async (req, res) => {
  try {
    const userText = req.body.message;

    // ✅ CEK FAQ DULU SEBELUM KE GEMINI
    const staticAnswer = findFaqAnswer(userText);
    if (staticAnswer) {
      console.log("✅ Dijawab dari FAQ (tanpa API)");
      return res.json({ reply: staticAnswer });
    }

    console.log("🔄 Tidak ada di FAQ, lanjut ke Gemini...");

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `
Anda adalah pegawai pada Kantor Wilayah Direktorat Jenderal Imigrasi Sulawesi Selatan. 
Tugas: Memberikan informasi tentang keimigrasian singkat, jelas, langsung ke inti.
Aturan Ketat:
- Gunakan bahasa sopan & profesional.
- Dilarang keras menggunakan simbol (*, #, poin-poin).
- Susun dalam kalimat biasa/paragraf tunggal.
- Tanpa sapaan waktu dan tanpa sapaan Bapak/Ibu.
- Jika info tidak ada, arahkan ke petugas terkait.
Pertanyaan user:
${userText}
                `
              }
            ]
          }
        ]
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, jawaban tidak tersedia.";
    res.json({ reply });

  } catch (error) {
    console.log("ERROR GEMINI:");
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
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      },
      responseType: "arraybuffer"
    });

    const contentType = response.headers["content-type"];
    if (!contentType || !contentType.includes("audio")) {
      return res.status(500).json({ error: "TTS gagal" });
    }

    res.set({ "Content-Type": "audio/mpeg" });
    res.send(response.data);

  } catch (error) {
    console.log("❌ ERROR ELEVEN:", error.response?.data?.toString() || error.message);
    res.status(500).json({ error: "TTS gagal" });
  }
});

/* =========================
   SERVER
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server jalan di http://localhost:" + PORT);
});