require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());   // lets the server read JSON sent in the body

// ENDPOINT 1: get all opportunities
app.get('/api/opportunities', (req, res) =>
{
    db.query('SELECT * FROM opportunities', (err, rows) =>
    {
        if (err)
        {
            return res.status(500).json({ error: 'Server error' });
        }
        res.status(200).json(rows);
    });
});

// ENDPOINT 2: create a new opportunity
app.post('/api/opportunities', (req, res) =>
{
    const { title, description, research_area, faculty_name, department,
        required_skills, positions, deadline } = req.body;

    // validation: all fields are required
    if (!title || !description || !research_area || !faculty_name ||
        !department || !required_skills || !positions || !deadline)
    {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // validation: deadline must be a real date like 2026-11-30
    const d = new Date(deadline + 'T00:00:00Z');
    if (isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== deadline)
    {
        return res.status(400).json({ error: 'Deadline must be a valid date (YYYY-MM-DD)' });
    }

    const sql = `INSERT INTO opportunities
    (title, description, research_area, faculty_name, department,
     required_skills, positions, deadline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [title, description, research_area, faculty_name,
        department, required_skills, positions, deadline];

    db.query(sql, values, (err, result) =>
    {
        if (err)
        {
            console.log(err);
            return res.status(500).json({ error: 'Server error' });
        }
        res.status(201).json({ message: 'Created', id: result.insertId });
    });
});

// ENDPOINT 3: get one opportunity
app.get('/api/opportunities/:id', (req, res) =>
{
    const id = req.params.id;

    db.query('SELECT * FROM opportunities WHERE id = ?', [id], (err, rows) =>
    {
        if (err)
        {
            console.log(err);
            return res.status(500).json({ error: 'Server error' });
        }
        if (rows.length === 0)
        {
            return res.status(404).json({ error: 'Opportunity not found' });
        }
        res.status(200).json(rows[0]);
    });
});

// ENDPOINT 4: update an opportunity (also used to close it)
app.put('/api/opportunities/:id', (req, res) =>
{
    const id = req.params.id;

    // step 1: find the existing row
    db.query('SELECT * FROM opportunities WHERE id = ?', [id], (err, rows) =>
    {
        if (err)
        {
            console.log(err);
            return res.status(500).json({ error: 'Server error' });
        }
        if (rows.length === 0)
        {
            return res.status(404).json({ error: 'Opportunity not found' });
        }

        // step 2: use new values if sent, otherwise keep the old ones
        const old = rows[0];
        const title = req.body.title || old.title;
        const description = req.body.description || old.description;
        const research_area = req.body.research_area || old.research_area;
        const faculty_name = req.body.faculty_name || old.faculty_name;
        const department = req.body.department || old.department;
        const required_skills = req.body.required_skills || old.required_skills;
        const positions = req.body.positions || old.positions;
        const deadline = req.body.deadline || old.deadline;
        const status = req.body.status || old.status;

        // step 3: status must be Open or Closed
        if (status !== 'Open' && status !== 'Closed')
        {
            return res.status(400).json({ error: 'Status must be Open or Closed' });
        }

        // step 4: save the changes
        const sql = `UPDATE opportunities SET
      title = ?, description = ?, research_area = ?, faculty_name = ?,
      department = ?, required_skills = ?, positions = ?, deadline = ?,
      status = ? WHERE id = ?`;

        const values = [title, description, research_area, faculty_name,
            department, required_skills, positions, deadline,
            status, id];

        db.query(sql, values, (err2) =>
        {
            if (err2)
            {
                console.log(err2);
                return res.status(500).json({ error: 'Server error' });
            }
            res.status(200).json({ message: 'Updated' });
        });
    });
});

// ENDPOINT 5: delete an opportunity
app.delete('/api/opportunities/:id', (req, res) =>
{
    const id = req.params.id;

    db.query('DELETE FROM opportunities WHERE id = ?', [id], (err, result) =>
    {
        if (err)
        {
            console.log(err);
            return res.status(500).json({ error: 'Server error' });
        }
        if (result.affectedRows === 0)
        {
            return res.status(404).json({ error: 'Opportunity not found' });
        }
        res.status(200).json({ message: 'Deleted' });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
{
    console.log('Server running on port ' + PORT);
});