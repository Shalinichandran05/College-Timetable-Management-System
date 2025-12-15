// Add Teacher Form Submission
document.getElementById('add-teacher-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const mobile = document.getElementById('mobile').value;
    const email = document.getElementById('email').value;

    try {
        const response = await fetch('/admin/add-teacher', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, address, mobile, email })
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            document.getElementById('add-teacher-form').reset();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
});