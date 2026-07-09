const { GoogleGenAI } = require('@google/genai');
const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());

// Konfigurasi penyimpanan file sementara di memori laptop
const upload = multer({ storage: multer.memoryStorage() });

// 1. Inisialisasi Gemini API
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// 2. Endpoint Chat yang mendukung teks dan file upload
app.post('/api/chat', upload.single('file'), async (req, res) => {
    try {
        const { message } = req.body;
        
        // Selalu buat sesi chat baru di dalam endpoint agar session tetap segar dan aman dari crash global
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                system_instruction: "Kamu adalah AetherAssist, asisten AI dari platform Aetherna. Jawablah dengan ramah, suportif, informatif, dan santai. Jika pengguna mengunggah file atau gambar, analisis dan berikan penjelasan atau bantuan terkait file tersebut."
            }
        });

        let response;

        // JIKA USER MENGUNGGAH FILE/GAMBAR
        if (req.file) {
            // Struktur data file attachment yang benar untuk SDK @google/genai terbaru
            const fileAttachment = {
                inlineData: {
                    data: req.file.buffer.toString("base64"),
                    mimeType: req.file.mimetype
                }
            };

            const userPrompt = message || "Tolong analisis file atau gambar ini.";

            // Untuk kombinasi File + Teks di SDK baru, kita kirim lewat struktur objek message yang rapi
            response = await chat.sendMessage({
                message: [userPrompt, fileAttachment]
            });

        } else {
            // JIKA USER HANYA MENGIRIM TEKS BIASA
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

app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Aetherna Backend is running'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Server Aetherna Backend berjalan di port ' + PORT);
});