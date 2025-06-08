const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Enable parsing JSON request bodies

// --- File-based Data Storage Setup ---
const dataDir = path.join(__dirname, 'data');
const feedingsFilePath = path.join(dataDir, 'feedings.json');
const messagesFilePath = path.join(dataDir, 'messages.json');
const imagesFilePath = path.join(dataDir, 'images.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Initialize data files if they don't exist
const initializeFile = (filePath, defaultContent) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
    }
};

initializeFile(feedingsFilePath, []);
initializeFile(messagesFilePath, []);
initializeFile(imagesFilePath, []);

// Helper function to read data from a file
const readData = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
};

// Helper function to write data to a file
const writeData = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error writing to ${filePath}:`, error);
    }
};

// --- API Endpoints ---

// Feeding Records
app.get('/api/feedings', (req, res) => {
    const feedings = readData(feedingsFilePath);
    res.json(feedings);
});

app.post('/api/feedings', (req, res) => {
    const feedings = readData(feedingsFilePath);
    const newRecord = { id: Date.now(), timestamp: new Date().toISOString(), ...req.body, deleted: false };
    feedings.unshift(newRecord); // Add to the beginning
    writeData(feedingsFilePath, feedings);
    res.status(201).json(newRecord);
});

app.put('/api/feedings/:id', (req, res) => {
    const feedings = readData(feedingsFilePath);
    const recordId = parseInt(req.params.id);
    const recordIndex = feedings.findIndex(record => record.id === recordId);

    if (recordIndex !== -1) {
        feedings[recordIndex] = { ...feedings[recordIndex], ...req.body };
        writeData(feedingsFilePath, feedings);
        res.json(feedings[recordIndex]);
    } else {
        res.status(404).json({ message: 'Feeding record not found' });
    }
});

// Messages
app.get('/api/messages', (req, res) => {
    const messages = readData(messagesFilePath);
    res.json(messages);
});

app.post('/api/messages', (req, res) => {
    const messages = readData(messagesFilePath);
    const newMessage = { id: Date.now(), timestamp: new Date().toISOString(), ...req.body };
    messages.unshift(newMessage);
    writeData(messagesFilePath, messages);
    res.status(201).json(newMessage);
});

// Images (Simplified: storing base64 for now, would use cloud storage in production)
app.get('/api/images', (req, res) => {
    const images = readData(imagesFilePath);
    res.json(images);
});

app.post('/api/images/upload', (req, res) => {
    const images = readData(imagesFilePath);
    const { url, timestamp } = req.body; // Expecting base64 data URL from frontend

    if (!url) {
        return res.status(400).json({ message: 'No image URL provided' });
    }

    const newImage = { id: Date.now(), url, timestamp: timestamp || new Date().toISOString() };
    images.unshift(newImage);
    writeData(imagesFilePath, images);
    res.status(201).json(newImage);
});

// Basic home route
app.get('/', (req, res) => {
    res.send('Cat Records Backend is running!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 