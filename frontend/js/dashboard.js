// Jalankan semua fungsi apabila halaman selesai dimuatkan
document.addEventListener('DOMContentLoaded', () => {
    loadRealTimeDate();
    loadAdminProfile();
    loadAssetStats();
    loadRecentAssets();
});

// 1. Fungsi untuk memaparkan tarikh real-time
function loadRealTimeDate() {
    const dateEl = document.getElementById('liveDate');
    if (!dateEl) return;

    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    const today = new Date();
    dateEl.textContent = today.toLocaleDateString('en-GB', options); // Contoh: Tue, 20 Oct 2026
}

// 2. Fungsi untuk mengambil data admin dari database dan memaparkan ucapan
async function loadAdminProfile() {
    try {
        const response = await fetch('/api/assets/admin-profile');
        const result = await response.json();

        if (result.success && result.data) {
            const username = result.data.username || 'Admin';
            
            // Ubah huruf pertama menjadi huruf besar (Capitalize) untuk estetika
            const formattedName = username.charAt(0).toUpperCase() + username.slice(1);

            // Update teks sambutan di bawah tarikh
            const welcomeMsgEl = document.getElementById('welcomeMessage');
            if (welcomeMsgEl) {
                const hour = new Date().getHours();
                let greeting = 'Good morning';
                if (hour >= 12 && hour < 18) greeting = 'Good afternoon';
                else if (hour >= 18) greeting = 'Good evening';

                welcomeMsgEl.textContent = `${greeting}, ${formattedName}!`;
            }

            // Update profil di penjuru kanan atas
            const nameEl = document.getElementById('adminName');
            const roleEl = document.getElementById('adminRole');
            if (nameEl) nameEl.textContent = formattedName;
            if (roleEl) roleEl.textContent = result.data.role || 'IT Administrator';
        }
    } catch (error) {
        console.error('Gagal memuat profil admin dari database:', error);
        
        // Nilai lalai jika database gagal diakses
        const nameEl = document.getElementById('adminName');
        if (nameEl) nameEl.textContent = 'Admin';
    }
}

// 3. Fungsi untuk mengambil data statistik KPI & Kategori Aset (Dengan Auto-Expiry)
async function loadAssetStats() {
    try {
        // Kita menggunakan /all untuk mengira data secara tepat berserta semakan tarikh di frontend
        const response = await fetch('/api/assets/all'); 
        const result = await response.json();

        if (result.success && result.data) {
            const assets = result.data;
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset masa untuk perbandingan tarikh tepat

            let activeCount = 0;
            let expiredCount = 0;
            let laptopCount = 0, desktopCount = 0, printerCount = 0, networkCount = 0;

            assets.forEach(asset => {
                let currentStatus = asset.status;

                // Logik semak tarikh automatik
                if (asset.expiry_date) {
                    const expiryDate = new Date(asset.expiry_date);
                    if (expiryDate < today) {
                        currentStatus = 'Expired'; // Paksa status jadi Expired jika tarikh dah lepas
                    }
                }

                // Kira Active vs Expired
                if (currentStatus === 'Expired') {
                    expiredCount++;
                } else {
                    activeCount++;
                }

                // Kira mengikut kategori
                if (asset.category === 'Laptop') laptopCount++;
                else if (asset.category === 'Desktop') desktopCount++;
                else if (asset.category === 'Printer') printerCount++;
                else if (asset.category === 'Network Device' || asset.category === 'Network') networkCount++;
            });

            // Update DOM untuk Total Assets
            const totalAssetsEl = document.getElementById('totalAssetsVal') || document.querySelector('.kpi-card:nth-child(1) .kpi-value');
            if (totalAssetsEl) totalAssetsEl.textContent = assets.length;

            // Update DOM untuk Active & Expired Deployments
            const activeDeployEl = document.getElementById('activeDeployVal');
            if (activeDeployEl) activeDeployEl.textContent = activeCount;
            
            const expiredDeployEl = document.getElementById('expiredDeployVal');
            if (expiredDeployEl) expiredDeployEl.textContent = expiredCount;

            // Update pecahan kategori
            const laptopEl = document.getElementById('laptopCount');
            const desktopEl = document.getElementById('desktopCount');
            const printerEl = document.getElementById('printerCount');
            const networkEl = document.getElementById('networkCount');

            if (laptopEl) laptopEl.textContent = laptopCount;
            if (desktopEl) desktopEl.textContent = desktopCount;
            if (printerEl) printerEl.textContent = printerCount;
            if (networkEl) networkEl.textContent = networkCount;
        }
    } catch (error) {
        console.error('Failed to load real-time database stats:', error);
    }
}

// 4. Fungsi untuk memuat senarai jadual aset terkini pada dashboard (Dengan Auto-Expiry)
async function loadRecentAssets() {
    try {
        const response = await fetch('/api/assets/list'); // Pastikan backend memulangkan limit terbaharu
        const result = await response.json();

        const tableBody = document.getElementById('assetTableBody');
        if (!tableBody) return;

        if (result.success && result.data && result.data.length > 0) {
            tableBody.innerHTML = '';
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            result.data.forEach(asset => {
                let displayStatus = asset.status;
                const dateShorthand = asset.expiry_date ? asset.expiry_date.split('T')[0] : '-';

                // Logik semak tarikh automatik untuk paparan jadual
                if (asset.expiry_date) {
                    const expiryDate = new Date(asset.expiry_date);
                    if (expiryDate < today) {
                        displayStatus = 'Expired';
                    }
                }

                // Penggayaan Badge Status yang menonjol
                let statusBadge = '';
                if (displayStatus === 'Active') {
                    statusBadge = `<span style="background: rgba(16, 185, 129, 0.15); color: #10B981; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">• Active</span>`;
                } else if (displayStatus === 'Expired') {
                    statusBadge = `<span style="background: rgba(239, 68, 68, 0.15); color: #EF4444; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">⚠ Expired</span>`;
                } else {
                    statusBadge = `<span style="background: rgba(245, 158, 11, 0.15); color: #F59E0B; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${displayStatus}</span>`;
                }

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="bold">${asset.asset_number}</td>
                    <td>${asset.category}</td>
                    <td>${asset.user_owned}</td>
                    <td>${dateShorthand}</td>
                    <td>${statusBadge}</td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">No assets registered yet.</td></tr>`;
        }
    } catch (error) {
        console.error('Error loading recent assets table:', error);
        const tableBody = document.getElementById('assetTableBody');
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #EF4444;">Failed to load assets.</td></tr>`;
        }
    }
}