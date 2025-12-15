const express = require('express');
const pool = require('../db/connection');
const router = express.Router();

// Admin Login (Keep only one route)
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM admin WHERE username = ?', [username]);

        if (rows.length > 0 && rows[0].password === password) {
            res.status(200).json({ message: 'Login successful', adminId: rows[0].id });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error during login' });
    }
});

// Add Teacher
router.post('/add-teacher', async (req, res) => {
    const { name, address, mobile, email } = req.body;

    try {
        const [result] = await pool.query(
            'INSERT INTO teacher (name, address, mobile_number, email) VALUES (?, ?, ?, ?)',
            [name, address, mobile, email]
        );
        res.status(201).json({ message: 'Teacher added successfully', teacherId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding teacher' });
    }
});

// Add Classroom
router.post('/add-classroom', async (req, res) => {
    const { room_number } = req.body;

    try {
        const [result] = await pool.query(
            'INSERT INTO classroom (room_number) VALUES (?)',
            [room_number]
        );
        res.status(201).json({ message: 'Classroom added successfully', classroomId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding classroom' });
    }
});

// Fetch All Teachers
router.get('/get-teachers', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name FROM teacher');
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching teachers' });
    }
});

// Add Course
router.post('/add-course', async (req, res) => {
    const { courseName, subjects } = req.body;

    if (!courseName || !Array.isArray(subjects) || subjects.length === 0) {
        return res.status(400).json({ message: 'Invalid input data' });
    }

    try {
        const [courseResult] = await pool.query('INSERT INTO course (name) VALUES (?)', [courseName]);
        const courseId = courseResult.insertId;

        for (const subject of subjects) {
            await pool.query('INSERT INTO subject (name, teacher_id, course_id) VALUES (?, ?, ?)', [
                subject.name,
                subject.teacherId,
                courseId
            ]);
        }

        res.status(201).json({ message: 'Course and subjects added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding course and subjects' });
    }
});

// Fetch All Courses
router.get('/get-courses', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name FROM course');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: 'Error fetching courses' });
    }
});

// Fetch Specific Course Details
router.get('/get-course/:courseId', async (req, res) => {
    const { courseId } = req.params;

    try {
        const [rows] = await pool.query(`
            SELECT 
                course.name AS courseName, -- Include the course name
                subject.id AS subjectId, 
                subject.name AS subjectName, 
                teacher.name AS teacherName
            FROM course
            JOIN subject ON course.id = subject.course_id
            JOIN teacher ON subject.teacher_id = teacher.id
            WHERE course.id = ?
        `, [courseId]);

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching course details:', error);
        res.status(500).json({ message: 'Error fetching course details' });
    }
});

// Fetch All Classrooms
router.get('/get-classrooms', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, room_number FROM classroom');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching classrooms:', error);
        res.status(500).json({ message: 'Error fetching classrooms' });
    }
});

// Generate Timetable
// Generate Timetable
router.get('/generate-timetable', async (req, res) => {
    const { courseId, lecturesPerDay } = req.query;

    try {
        // Fetch subjects and teachers for the course
        const [subjects] = await pool.query(`
            SELECT subject.id AS subjectId, subject.name AS subjectName, teacher.name AS teacherName
            FROM subject
            JOIN teacher ON subject.teacher_id = teacher.id
            WHERE subject.course_id = ?
        `, [courseId]);

        if (subjects.length === 0) {
            return res.status(404).json({ message: 'No subjects found for this course' });
        }

        // Fetch existing timetables to check for teacher availability
        const [existingTimetables] = await pool.query(`
            SELECT timetable
            FROM timetables
        `);

        // Combine all timetables into a single structure for teacher availability
        const teacherAvailability = {};
        existingTimetables.forEach(({ timetable }) => {
            let parsedTimetable;

            try {
                // Ensure the timetable is parsed correctly
                parsedTimetable = typeof timetable === 'string' ? JSON.parse(timetable) : timetable;
            } catch (error) {
                console.error('Failed to parse timetable:', timetable, 'Error:', error);
                return; // Skip this timetable if it cannot be parsed
            }

            // Process each day's timetable
            Object.entries(parsedTimetable).forEach(([day, lectures]) => {
                if (!teacherAvailability[day]) {
                    teacherAvailability[day] = {};
                }
                lectures.forEach((lecture, slot) => {
                    if (!teacherAvailability[day][slot]) {
                        teacherAvailability[day][slot] = new Set();
                    }
                    teacherAvailability[day][slot].add(lecture.teacherName);
                });
            });
        });

        // Initialize the timetable object
        const timetable = {};
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        // Helper function to shuffle an array
        const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);

        // Track subject usage per day to limit repetition
        const subjectUsagePerDay = {};
        days.forEach(day => subjectUsagePerDay[day] = {});

        // Track global subject usage to balance distribution
        const globalSubjectUsage = {};
        subjects.forEach(subject => globalSubjectUsage[subject.subjectName] = 0);

        // Generate timetable
        days.forEach(day => {
            timetable[day] = []; // Initialize the day's lectures

            for (let lecture = 0; lecture < lecturesPerDay; lecture++) {
                let assigned = false;

                // Shuffle subjects to randomize the order
                const shuffledSubjects = shuffleArray([...subjects]);

                for (const subject of shuffledSubjects) {
                    const { subjectName, teacherName } = subject;

                    // Get subject usage for the day
                    const dailyUsage = subjectUsagePerDay[day][subjectName] || 0;

                    // Check if the subject can be assigned without collisions
                    if (
                        dailyUsage < 2 &&
                        globalSubjectUsage[subjectName] < lecturesPerDay * days.length &&
                        (!teacherAvailability[day]?.[lecture] || !teacherAvailability[day][lecture].has(teacherName))
                    ) {
                        // Assign subject-teacher pair
                        timetable[day].push({ subjectName, teacherName });

                        // Update usage tracking
                        subjectUsagePerDay[day][subjectName] = dailyUsage + 1;
                        globalSubjectUsage[subjectName]++;

                        // Mark the teacher as unavailable for this slot
                        if (!teacherAvailability[day]) {
                            teacherAvailability[day] = {};
                        }
                        if (!teacherAvailability[day][lecture]) {
                            teacherAvailability[day][lecture] = new Set();
                        }
                        teacherAvailability[day][lecture].add(teacherName);

                        assigned = true;
                        break;
                    }
                }

                // Fallback: If no suitable subject is found, reuse a random subject
                if (!assigned) {
                    const randomSubject = shuffleArray(subjects)[0];
                    timetable[day].push({
                        subjectName: randomSubject.subjectName,
                        teacherName: randomSubject.teacherName
                    });
                }
            }
        });

        res.status(200).json(timetable);
    } catch (error) {
        console.error('Error generating timetable:', error);
        res.status(500).json({ message: 'Error generating timetable' });
    }
});
// Save Timetable
router.post('/save-timetable', async (req, res) => {
    const { courseId, roomNumber: roomId, lecturesPerDay, timetable } = req.body;

    try {
        // Fetch the actual room_number using the roomId
        const [roomResult] = await pool.query(`SELECT room_number FROM classroom WHERE id = ?`, [roomId]);
        if (roomResult.length === 0) {
            return res.status(400).json({ message: 'Invalid room ID' });
        }

        const roomNumber = roomResult[0].room_number;

        // Save the timetable with the actual room_number
        await pool.query(
            `INSERT INTO timetables (course_id, room_number, lectures_per_day, timetable)
             VALUES (?, ?, ?, ?)`,
            [courseId, roomNumber, lecturesPerDay, JSON.stringify(timetable)]
        );

        res.status(200).json({ message: 'Timetable saved successfully' });
    } catch (error) {
        console.error('Error saving timetable:', error);
        res.status(500).json({ message: 'Error saving timetable' });
    }
});
// Get All Timetables
router.get('/view-timetables', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.id, c.name AS courseName, t.room_number AS roomNumber, t.lectures_per_day AS lecturesPerDay, t.timetable
            FROM timetables t
            JOIN course c ON t.course_id = c.id
        `);

        // Log roomNumber values for debugging
        rows.forEach(row => {
            console.log('Row:', row); // Log the entire row
            console.log('Room Number:', row.roomNumber); // Specifically log roomNumber
        });

        res.status(200).json(rows); // Send the response as-is
    } catch (error) {
        console.error('Error fetching timetables:', error);
        res.status(500).json({ message: 'Error fetching timetables' });
    }
});
// Delete Timetable
router.delete('/delete-timetable/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Delete the timetable from the database
        const [result] = await pool.query(`DELETE FROM timetables WHERE id = ?`, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Timetable not found' });
        }

        res.status(200).json({ message: 'Timetable deleted successfully' });
    } catch (error) {
        console.error('Error deleting timetable:', error);
        res.status(500).json({ message: 'Error deleting timetable' });
    }
});

module.exports = router;