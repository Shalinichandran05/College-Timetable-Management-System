document.getElementById('generate-subjects-btn').addEventListener('click', async () => {
    const subjectCount = parseInt(document.getElementById('subject-count').value);
    const subjectFieldsContainer = document.getElementById('subject-fields');
    subjectFieldsContainer.innerHTML = '';

    // Fetch teachers
    let teachers = [];
    try {
        const response = await fetch('/admin/get-teachers');
        teachers = await response.json();
    } catch (error) {
        alert('Error fetching teachers: ' + error.message);
        return;
    }

    for (let i = 1; i <= subjectCount; i++) {
        const div = document.createElement('div');
        div.innerHTML = `
            <label for="subject-${i}-name">Subject ${i} Name:</label>
            <input type="text" id="subject-${i}-name" name="subject-${i}-name" required>

            <label for="subject-${i}-teacher">Teacher:</label>
            <select id="subject-${i}-teacher" name="subject-${i}-teacher" required>
                ${teachers.map(teacher => `<option value="${teacher.id}">${teacher.name}</option>`).join('')}
            </select>
        `;
        subjectFieldsContainer.appendChild(div);
    }

    // Ensure subject field wrapper is visible
    document.getElementById('subject-wrapper').style.display = 'block';
    document.getElementById('submit-course-btn').disabled = false; // Enable submit button
});

document.addEventListener('click', (event) => {
    const subjectWrapper = document.getElementById('subject-wrapper');
    const generateBtn = document.getElementById('generate-subjects-btn');
    if (!subjectWrapper.contains(event.target) && event.target !== generateBtn) {
        if (document.getElementById('subject-fields').innerHTML.trim() === '') {
            subjectWrapper.style.display = 'none';
        }
    }
});

document.getElementById('add-course-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const courseName = document.getElementById('course-name').value.trim();
    const subjectCount = parseInt(document.getElementById('subject-count').value);
    const subjects = [];

    for (let i = 1; i <= subjectCount; i++) {
        const subjectNameInput = document.getElementById(`subject-${i}-name`);
        const teacherSelect = document.getElementById(`subject-${i}-teacher`);

        if (!subjectNameInput || !teacherSelect) {
            alert(`Subject ${i} fields are missing.`);
            return;
        }

        const subjectName = subjectNameInput.value.trim();
        const teacherId = teacherSelect.value;

        if (!subjectName || !teacherId) {
            alert(`Fill all fields for Subject ${i}.`);
            return;
        }

        subjects.push({ name: subjectName, teacherId });
    }

    try {
        const response = await fetch('/admin/add-course', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseName, subjects }),
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            document.getElementById('add-course-form').reset();
            document.getElementById('subject-fields').innerHTML = '';
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
});