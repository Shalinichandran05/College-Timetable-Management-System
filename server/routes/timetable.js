const express = require('express');
const pool = require('../db/connection');
const router = express.Router();

// Create Timetable
router.post('/create', async (req, res) => {
    const { courseId, roomNumber, timetable } = req.body;

    try {
        for (const entry of timetable) {
            const { day, lectureNumber, subjectId } = entry;

            await pool.query(
                'INSERT INTO timetable (course_id, room_number, day, lecture_number, subject_id) VALUES (?, ?, ?, ?, ?)',
                [courseId, roomNumber, day, lectureNumber, subjectId]
            );
        }

        res.status(201).json({ message: 'Timetable created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating timetable' });
    }
});

// View Timetables
router.get('/view', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT t.*, c.name as course_name, s.name as subject_name 
             FROM timetable t 
             JOIN course c ON t.course_id = c.id 
             JOIN subject s ON t.subject_id = s.id`
        );

        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching timetables' });
    }
});

// Delete Timetable
router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM timetable WHERE id = ?', [id]);
        res.status(200).json({ message: 'Timetable deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting timetable' });
    }
});

module.exports = router;