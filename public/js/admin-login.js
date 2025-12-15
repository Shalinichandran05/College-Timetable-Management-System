// Handle Admin Login Form Submission
document.getElementById('admin-login-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            window.location.href = '/admin/dashboard.html'; // Redirect to the Admin Dashboard
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
});