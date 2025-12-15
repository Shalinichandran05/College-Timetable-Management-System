// Handle Add Classroom Form Submission
document.getElementById('add-classroom-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const roomNumber = document.getElementById('room-number').value;

    try {
        const response = await fetch('/admin/add-classroom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_number: roomNumber })
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            document.getElementById('add-classroom-form').reset();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
});