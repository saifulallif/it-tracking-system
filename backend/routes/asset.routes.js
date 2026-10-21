const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Koneksi berasaskan Promise (mysql2/promise)

// 1. API: Simpan Aset Baru (Menambah aset dari form details.html)
router.post('/add', async (req, res) => {
    const { asset_number, category, user_owned, expiry_date, status } = req.body;

    if (!asset_number || !category || !user_owned || !expiry_date || !status) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const query = 'INSERT INTO assets (asset_number, category, user_owned, expiry_date, status) VALUES (?, ?, ?, ?, ?)';
    
    try {
        await db.query(query, [asset_number, category, user_owned, expiry_date, status]);
        res.json({ success: true, message: 'Asset successfully registered!' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Asset tag already exists!' });
        }
        return res.status(500).json({ success: false, message: err.message });
    }
});

// 2. API: Mengambil Statistik Dashboard (Total & Kategori Aset)
router.get('/stats', async (req, res) => {
    const query = `
        SELECT 
            COUNT(*) as total_assets,
            SUM(CASE WHEN category = 'Laptop' THEN 1 ELSE 0 END) as laptops,
            SUM(CASE WHEN category = 'Desktop' THEN 1 ELSE 0 END) as desktops,
            SUM(CASE WHEN category = 'Printer' THEN 1 ELSE 0 END) as printers,
            SUM(CASE WHEN category = 'Network Device' THEN 1 ELSE 0 END) as network_devices
        FROM assets;
    `;
    try {
        const [results] = await db.query(query);
        res.json({ success: true, data: results[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 3. API: Mengambil Senarai Aset Terkini (Untuk tabel di Dashboard)
router.get('/list', async (req, res) => {
    const query = 'SELECT asset_number, category, user_owned, expiry_date, status FROM assets ORDER BY id DESC LIMIT 5';
    try {
        const [results] = await db.query(query);
        res.json({ success: true, data: results });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 4. API: Mengambil Aset yang Akan Expired (Dalam masa 1 bulan)
router.get('/expiring-soon', async (req, res) => {
    const query = `
        SELECT asset_number, category, user_owned, expiry_date, status 
        FROM assets 
        WHERE expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 1 MONTH)
        ORDER BY expiry_date ASC;
    `;
    try {
        const [results] = await db.query(query);
        res.json({ success: true, data: results });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 5. API: Mengambil Profil Admin (Dari tabel users)
router.get('/admin-profile', async (req, res) => {
    const query = 'SELECT username FROM users LIMIT 1'; 
    try {
        const [results] = await db.query(query);
        if (results.length === 0) {
            return res.json({ success: true, data: { username: 'Admin', role: 'IT Administrator' } });
        }
        res.json({ success: true, data: { username: results[0].username, role: 'IT Administrator' } });
    } catch (err) {
        res.json({ success: true, data: { username: 'Admin', role: 'IT Administrator' } });
    }
});

// 6. API: Mengambil SEMUA senarai aset tanpa had (Untuk assets.html)
router.get('/all', async (req, res) => {
    const query = 'SELECT id, asset_number, category, user_owned, expiry_date, status FROM assets ORDER BY id DESC';
    try {
        const [results] = await db.query(query);
        res.json({ success: true, data: results });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 7. API: Mengemaskini (Edit) Aset sedia ada
router.put('/update/:id', async (req, res) => {
    const { asset_number, category, user_owned, expiry_date, status } = req.body;
    const query = 'UPDATE assets SET asset_number=?, category=?, user_owned=?, expiry_date=?, status=? WHERE id=?';
    
    try {
        await db.query(query, [asset_number, category, user_owned, expiry_date, status, req.params.id]);
        res.json({ success: true, message: 'Asset updated successfully!' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Asset tag already exists!' });
        }
        res.status(500).json({ success: false, message: err.message });
    }
});

// API: Mengambil Aset yang TELAH LUPUT (Expired)
router.get('/expired', async (req, res) => {
    // Cari aset yang tarikhnya sudah lepas HARI INI, atau statusnya dilabel 'Expired'
    const query = `
        SELECT id, asset_number, category, user_owned, expiry_date, status 
        FROM assets 
        WHERE expiry_date < CURDATE() OR status = 'Expired'
        ORDER BY expiry_date DESC;
    `;
    try {
        const [results] = await db.query(query);
        res.json({ success: true, data: results });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;