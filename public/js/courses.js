document.addEventListener('DOMContentLoaded', async () => {
    const coursesList = document.getElementById('courses-list');

    try {
        const response = await fetch('/admin/get-courses'); // Fetch courses from the backend
        const courses = await response.json();

        courses.forEach(course => {
            const button = document.createElement('button'); // Create a button element
            button.className = 'course-button'; // Add the 'course-button' class for styling
            button.textContent = course.name; // Set the button text to the course name
            button.onclick = () => {
                // Redirect to the create timetable page with the course ID as a query parameter
                window.location.href = `/admin/create-timetable.html?courseId=${course.id}`;
            };
            coursesList.appendChild(button); // Append the button to the courses list container
        });
    } catch (error) {
        console.error('Error fetching courses:', error); // Log any errors to the console
        coursesList.textContent = 'Failed to load courses.'; // Display an error message to the user
    }
});