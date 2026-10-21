// backend/server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Test DB Connection
const db = require('./config/db');

// ==========================================
// 1. MIDDLEWARE UTAMA
// ==========================================
// Middleware untuk memproses data dari Frontend (JSON & Cookies)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Wajib untuk baca cookie JWT

// ==========================================
// 2. DAFTARKAN API ROUTES (MESTI DI ATAS STATIC FILES)
// ==========================================
// API untuk Pengesahan (Login/Auth)
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// API untuk Pengurusan Aset (Dashboard, Senarai, Tambah Aset)
const assetRoutes = require('./routes/asset.routes');
app.use('/api/assets', assetRoutes);

// ==========================================
// 3. KAWALAN AKSES HALAMAN (PROTECTED ROUTES)
// ==========================================
// Lindungi fail dashboard.html. Jika tiada token, tendang ke login.html
app.get('/dashboard.html', (req, res, next) => {
    const token = req.cookies.auth_token;
    if (!token) {
        return res.redirect('/login.html');
    }
    next();
});

// ==========================================
// 4. HIDANGKAN FAIL STATIK (FRONTEND)
// ==========================================
// Hidangkan fail statik (HTML, CSS, JS) dari folder frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Jika pengguna mengakses root ('/'), hantar ke login.html secara lalai
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// ==========================================
// 5. MULAKAN PELAYAN (SERVER)
// ==========================================
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});