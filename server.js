const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;


app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); 


let notes = [];
let nextId = 1;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create a note
app.post('/api/notes', (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ message: 'Title and content required' });

  const newNote = { id: nextId++, title, content };
  notes.push(newNote);
  res.status(201).json(newNote);
});

// Get all notes from request
app.get('/api/notes', (req, res) => res.json(notes));

// Update note
app.put('/api/notes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const note = notes.find(n => n.id === id);
  if (!note) return res.status(404).json({ message: 'Note not found' });

  note.title = req.body.title || note.title;
  note.content = req.body.content || note.content;
  res.json(note);
});

// Delete note
app.delete('/api/notes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  notes = notes.filter(n => n.id !== id);
  res.json({ message: `Note ${id} deleted.` });
});

// Start server
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
