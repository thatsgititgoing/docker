const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const users = [];

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// Get registered users
app.get('/users', (req, res) => {
    return res.json({ users });
});

// Register a new user
app.post('/users', (req, res) => {
    const newUserId = req.body.userId;
    if (!newUserId) {
        return res.status(400).send('Missing user Id');
    }
    if (users.includes(newUserId)) {
        return res.status(400).send('User already exists');
    }

    users.push(newUserId);
    return res.status(201).send('User registered successfully.');
});    


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});