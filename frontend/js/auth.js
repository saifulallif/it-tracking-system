// frontend/js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Halang page reload

            const usernameInput = document.getElementById('username').value;
            const passwordInput = document.getElementById('password').value;
            const submitBtn = loginForm.querySelector('.btn-emerald'); // Menyesuaikan dengan butang .btn-emerald baru

            // Sembunyikan error lama dan tukar teks butang
            if (loginError) loginError.style.display = 'none';
            
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Logging In...';
            submitBtn.disabled = true;

            try {
                // Hantar request ke Backend Node.js
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: usernameInput,
                        password: passwordInput
                    })
                });

                const data = await response.json();

                if (data.success) {
                    // Jika berjaya, terus bawa ke Dashboard
                    window.location.href = '/dashboard.html';
                } else {
                    throw new Error(data.message || 'Username atau password salah.');
                }

            } catch (error) {
                // Paparkan mesej error
                if (loginError) {
                    loginError.textContent = error.message;
                    loginError.style.display = 'block';
                }
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});