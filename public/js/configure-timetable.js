// Declare a global variable to store the generated timetable
let generatedTimetable = null;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('courseId');
    const courseNameEl = document.getElementById('course-name');
    const roomNumberDropdown = document.getElementById('room-number');
    const timetableContainer = document.getElementById('timetable-container');
    const generateTimetableBtn = document.getElementById('generate-timetable-btn');

    // Fetch course and classroom details
    try {
        const [courseResponse, roomsResponse] = await Promise.all([
            fetch(`/admin/get-course/${courseId}`),
            fetch('/admin/get-classrooms')
        ]);

        if (!courseResponse.ok || !roomsResponse.ok) {
            throw new Error('Failed to fetch course or classroom data');
        }

        const courseSubjects = await courseResponse.json();
        const classrooms = await roomsResponse.json();

        // Debugging the API response
        console.log('Course Subjects API Response:', courseSubjects);

        // Display course name
        if (courseSubjects.length > 0) {
            const courseName = courseSubjects[0].courseName || "Unknown Course";
            if (!courseNameEl.textContent.includes(courseName)) {
                courseNameEl.textContent = courseName;
            }
        } else {
            courseNameEl.textContent = 'No subjects found for this course';
        }

        // Populate room number dropdown
        roomNumberDropdown.innerHTML = ''; // Clear existing options
        classrooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.id;
            option.textContent = room.room_number;
            roomNumberDropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching course or classrooms:', error);
        courseNameEl.textContent = 'Error loading course or classroom data';
    }

    // Generate Timetable
    generateTimetableBtn.addEventListener('click', async () => {
        const lecturesPerDay = parseInt(document.getElementById('lectures-per-day').value);

        try {
            const response = await fetch(`/admin/generate-timetable?courseId=${courseId}&lecturesPerDay=${lecturesPerDay}`);
            if (!response.ok) {
                throw new Error('Failed to generate timetable');
            }

            const timetable = await response.json();

            // Store timetable in the global variable
            generatedTimetable = timetable;

            // Render timetable
            timetableContainer.innerHTML = ''; // Clear previous timetable
            timetableContainer.classList.add('timetable-output');
            const table = document.createElement('table');
            table.border = 1;

            // Create table header
            const headerRow = document.createElement('tr');
            headerRow.innerHTML = `<th>Days</th>`;
            for (let i = 1; i <= lecturesPerDay; i++) {
                headerRow.innerHTML += `<th>Lecture ${i}</th>`;
            }
            table.appendChild(headerRow);

            // Populate table rows for each day
            const days = Object.keys(timetable);
            days.forEach(day => {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${day}</td>`;
                timetable[day].forEach(lecture => {
                    row.innerHTML += `<td>${lecture.subjectName}<br>${lecture.teacherName}</td>`;
                });
                table.appendChild(row);
            });

            timetableContainer.appendChild(table);
        } catch (error) {
            console.error('Error generating timetable:', error);
            timetableContainer.innerHTML = '<p>Error generating timetable. Please try again.</p>';
        }
    });
});

// Save Timetable
document.getElementById('save-timetable').addEventListener('click', async () => {
    const courseId = new URLSearchParams(window.location.search).get('courseId');
    const roomNumber = document.getElementById('room-number').value;
    const lecturesPerDay = document.getElementById('lectures-per-day').value;

    // Check if the timetable is generated
    if (!generatedTimetable) {
        alert('No timetable generated to save. Please generate a timetable first.');
        return;
    }

    try {
        const response = await fetch('/admin/save-timetable', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId, roomNumber, lecturesPerDay, timetable: generatedTimetable })
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message);
        } else {
            alert(result.message || 'Failed to save timetable');
        }
    } catch (error) {
        console.error('Error saving timetable:', error);
        alert('Error saving timetable');
    }
});