const bcrypt = require('bcrypt');
const db = require('./backend/config/db');

async function resetAdminPassword() {
    try {
        const plainPassword = 'admin123';
        // Biarkan Node.js anda sendiri yang buat enkripsi (hash) sebenar
        const realHash = await bcrypt.hash(plainPassword, 10);
        
        // Kemas kini database secara automatik
        await db.execute("UPDATE users SET password_hash = ? WHERE username = 'admin'", [realHash]);
        
        console.log('✅ Berjaya! Password admin telah dikemas kini dengan hash yang sah.');
        console.log('🔑 Hash sebenar anda:', realHash);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Ralat:', error.message);
        process.exit(1);
    }
}

resetAdminPassword();