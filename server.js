const express = require('express'); // Web framework for Node.js
const morgan = require('morgan'); // HTTP request logger middleware for Node.js
const pg = require('pg');
const app = express();
const client = new pg.Client('postgres://localhost/acme_hr_directory'); // Connect to PostgreSQL database

app.use(morgan('dev')); 
app.use(express.json()); 

//Express server listening on port 3000
app.listen(3000, () => { 
    console.log('Server is running on port 3000');
})
