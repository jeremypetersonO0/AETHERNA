const { GoogleGenAI } = require('@google/genai');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require("path");

const app = express();

// Aktifkan CORS agar frontend kamu dari hosting lain bisa mendeteksi API ini
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Konfigurasi penyimpanan file sementara di memori
const upload = multer({ storage: multer.memoryStorage() });

// 1. Inisialisasi Gemini API (Pastikan GEMINI_API_KEY sudah diset di Variables Railway)
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// 2. Endpoint Chat yang mendukung teks dan file upload
app.post('/api/chat', upload.single('file'), async (req, res) => {
    try {
        const { message } = req.body;
        
        // Buat sesi chat baru dengan konfigurasi camelCase yang benar untuk SDK baru
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: "Kamu adalah AetherAssist, asisten AI dari platform Aetherna. Jawablah dengan ramah, suportif, informatif, dan santai. Jika pengguna mengunggah file atau gambar, analisis dan berikan penjelasan atau bantuan terkait file tersebut."
            }
        });

        let response;

        // JIKA USER MENGUNGGAH FILE/GAMBAR
        if (req.file) {
            const fileAttachment = {
                inlineData: {
                    data: req.file.buffer.toString("base64"),
                    mimeType: req.file.mimetype
                }
            };

            const userPrompt = message || "Tolong analisis file atau gambar ini.";

            // STRUKTUR YANG BENAR: Bungkus teks dan file ke dalam objek parts
            response = await chat.sendMessage({
                message: [
                    { text: userPrompt },
                    fileAttachment
                ]
            });

        } else {
            // JIKA USER HANYA MENGIRIM TEKS BIASA
            // STRUKTUR YANG BENAR: Bungkus teks ke dalam format object message yang dikenali ContentUnion
            response = await chat.sendMessage({
                message: message
            });
        }
        
        // Kirim jawaban sukses kembali ke frontend HTML kamu
        res.json({ reply: response.text });

    } catch (error) {
        console.error("Eror pada backend:", error);
        res.status(500).json({ reply: "AetherAssist gagal memproses file atau pesan kamu. 😓" });
    }
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Server Aetherna Backend berjalan di port ' + PORT);
});