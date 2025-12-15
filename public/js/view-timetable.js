// Fetch and display saved timetables
async function loadTimetables() {
    try {
        const response = await fetch('/admin/view-timetables');
        if (!response.ok) {
            throw new Error('Failed to fetch timetables');
        }

        const timetables = await response.json();
        const container = document.getElementById('saved-timetables');
        container.innerHTML = ''; // Clear existing content

        if (timetables.length === 0) {
            container.innerHTML = '<p>No timetables found</p>';
            return;
        }

        // Define the correct order of days
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        timetables.forEach(timetable => {
            const timetableDiv = document.createElement('div');
            timetableDiv.className = 'styled-timetable'; // Adding class for styling
            timetableDiv.innerHTML = `
                <h3 class="course-name">Timetable for ${timetable.courseName}</h3>
                <p>Room Number: <strong>${timetable.roomNumber}</strong></p>
                <p>Lectures Per Day: <strong>${timetable.lecturesPerDay}</strong></p>
            `;

            // Create a table for the timetable
            const table = document.createElement('table');
            table.className = 'timetable-table'; // Using the class for consistent styling

            // Add table header
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            headerRow.innerHTML = `
                <th>Days</th>
            `;
            for (let i = 1; i <= timetable.lecturesPerDay; i++) {
                headerRow.innerHTML += `<th>Lecture ${i}</th>`;
            }
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Add table body
            const tbody = document.createElement('tbody');
            dayOrder.forEach(day => {
                const subjects = timetable.timetable[day]; // Ensure the correct day order
                const row = document.createElement('tr');
                row.innerHTML = `<td>${day}</td>`;
                if (subjects) {
                    subjects.forEach(subject => {
                        row.innerHTML += `<td>${subject.subjectName}<br><small>${subject.teacherName}</small></td>`;
                    });
                } else {
                    // Fill empty cells if no subjects are available
                    for (let i = 0; i < timetable.lecturesPerDay; i++) {
                        row.innerHTML += '<td>—</td>';
                    }
                }
                tbody.appendChild(row);
            });
            table.appendChild(tbody);

            // Append the table to the timetableDiv
            timetableDiv.appendChild(table);
            container.appendChild(timetableDiv);
        });
    } catch (error) {
        console.error('Error loading timetables:', error);
        document.getElementById('saved-timetables').innerHTML = '<p>Error loading timetables</p>';
    }
}

// Load timetables on page load
document.addEventListener('DOMContentLoaded', loadTimetables);
