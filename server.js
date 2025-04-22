const express = require('express'); // Web framework for Node.js
const app = express();
const pg = require('pg');
const morgan = require('morgan'); // HTTP request logger middleware for Node.js

const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_hr_directory')
const port = process.env.PORT || 3000; // Set the port for the server

app.use(morgan('dev')); 
app.use(express.json()); 

// Get all departments
app.get('/api/departments', async (req, res, next) => {
    try {
        const result = await client.query('SELECT * FROM departments'); // Query to get all departments
        res.send(result.rows); 
    } catch (error) {
        console.error('Error fetching departments:', error); // Log any errors
        next(error); // Pass the error to the next middleware
    }
});

// Get all employees
app.get('/api/employees', async (req, res, next) => {
    try {
        const result = await client.query('SELECT * FROM employees'); // Query to get all employees
        res.send(result.rows); 
    } catch (error) {
        console.error('Error fetching employees:', error); // Log any errors
        next(error); // Pass the error to the next middleware
    }
});

// Post a new employee
app.post('/api/employees', async (req, res, next) => {
    try {
        const { name, department_id } = req.body; // Destructure the request body
        const result = await client.query(
            'INSERT INTO employees (name, department_id) VALUES ($1, $2) RETURNING *', // SQL query to insert a new employee
            [name, department_id] // Values to be inserted
        );
        res.status(201).send(result.rows[0]); // Send the created employee as response
    } catch (error) {
        console.error('Error creating employee:', error); // Log any errors
        next(error); // Pass the error to the next middleware
    }
});

// Delete an employee
app.delete('/api/employees/:id', async (req, res, next) => {
    try {
        await client.query('DELETE FROM employees WHERE id = $1', [req.params.id]); // SQL query to delete an employee by id
        res.sendStatus(204); // Send No Content status
    } catch (error) {
        console.error('Error deleting employee:', error); // Log any errors
        next(error); // Pass the error to the next middleware
    }
});

// Update an employee
app.put('/api/employees/:id', async (req, res, next) => {
    try {
        const { name, department_id } = req.body; // Destructure the request body
        const result = await client.query(
            `UPDATE employees
            SET name = $1, department_id = $2, updated_at = now()
            WHERE id = $3 RETURNING *`, // SQL query to update an employee
            [name, department_id, req.params.id] // Values to be updated
        );
        res.send(result.rows[0]); // Send the updated employee as response
    } catch (error) {
        console.error('Error updating employee:', error); // Log any errors
        next(error); // Pass the error to the next middleware
    }
});

const init = async () => {
    try {
        await client.connect(); // Connect to the PostgreSQL database
        console.log('Connected to PostgreSQL database');

        // SQL query to drop existing tables and create new ones
        let sql = `
        DROP TABLE IF EXISTS employees;
        DROP TABLE IF EXISTS departments;

        CREATE TABLE departments (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL
        );

        CREATE TABLE employees (
            id SERIAL PRIMARY KEY, 
            name VARCHAR(100) NOT NULL,
            department_id INTEGER REFERENCES departments(id),
            created_at TIMESTAMP DEFAULT now(), 
            updated_at TIMESTAMP DEFAULT now()
        );
        `;
        
        await client.query(sql); // Execute the SQL query
        console.log('Tables created successfully'); // Log the result rows

        // Seeeding the database with initial data
        //Seed departments table
        sql = `
            INSERT INTO departments (name) VALUES
            ('Software Engineering'),
            ('Human Resources'),
            ('Finance'),
            ('Sales');
            `;
        await client.query(sql); 

        //Seed employees table
        sql = `
            INSERT INTO employees (name, department_id) VALUES
            ('Alice', 1),
            ('Bob', 2),
            ('Charlie', 3),
            ('David', 4),
            ('Sonia', 3);
            `;
        await client.query(sql); 
        console.log('Data seeded successfully'); // Log the result rows

    //Error handling middleware
    app.use((error, req, res, next) => {
        console.error('Error:', error); // Log the error
        res.status(500).send('Internal Server Error'); // Send a 500 Internal Server Error response
    });
    
    //Express server listening on port 3000
    app.listen(port, () => { 
        console.log(`Server is running on port ${port}`); // Log the server start message
    });
    }
    catch (error) {
        console.error('Error connecting to the database:', error); // Log any connection errors
    }
};

init(); // Call the init function to start the server and connect to the database

