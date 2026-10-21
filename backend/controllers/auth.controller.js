// backend/controllers/auth.controller.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Semak jika input kosong
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Sila masukkan username dan password.' });
        }

        // 2. Cari pengguna dalam database MySQL
        const [users] = await db.execute('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Incorrect password or username.' });
        }

        const user = users[0];

        // 3. Bandingkan password yang dimasukkan dengan hash di database
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect password or username.' });
        }

        // 4. Semak jika pengguna adalah Admin atau IT Staff (Hanya mereka boleh tambah/edit aset)
        if (user.role !== 'Admin' && user.role !== 'IT_Staff') {
            return res.status(403).json({ success: false, message: 'Access denied. You are not an Admin.' });
        }

        // 5. Cipta Token Akses (JWT) untuk pastikan dia kekal log masuk
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            process.env.SESSION_SECRET || 'rahsia_sementara',
            { expiresIn: '8h' }
        );

        // 6. Simpan token di dalam HTTP-Only Cookie (Sangat Secure)
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Guna HTTPS di production
            maxAge: 8 * 60 * 60 * 1000 // 8 jam
        });

        // 7. Hantar respons berjaya ke Frontend
        res.json({
            success: true,
            message: 'Berjaya log masuk.',
            user: { id: user.id, username: user.username, role: user.role }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'Ralat pelayan (Server Error).' });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('auth_token');
    res.json({ success: true, message: 'Berjaya log keluar.' });
};