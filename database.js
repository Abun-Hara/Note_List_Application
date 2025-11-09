// Simple JSON file-based database
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'database.json');

// Initialize database file if it doesn't exist
function initDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [],
      notes: [],
      nextUserId: 1,
      nextNoteId: 1
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  }
}

// Read database
function readDatabase() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    initDatabase();
    return readDatabase();
  }
}

// Write database
function writeDatabase(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Database operations
const db = {
  // Users
  createUser: (name, email, password) => {
    const data = readDatabase();
    const user = {
      id: data.nextUserId++,
      name,
      email,
      password,
      created_at: new Date().toISOString()
    };
    data.users.push(user);
    writeDatabase(data);
    return user;
  },

  getUserByEmail: (email) => {
    const data = readDatabase();
    return data.users.find(u => u.email === email);
  },

  getUserById: (id) => {
    const data = readDatabase();
    return data.users.find(u => u.id === id);
  },

  // Notes
  createNote: (userId, title, content) => {
    const data = readDatabase();
    const note = {
      id: data.nextNoteId++,
      user_id: userId,
      title,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.notes.push(note);
    writeDatabase(data);
    return note;
  },

  getNotesByUserId: (userId) => {
    const data = readDatabase();
    return data.notes.filter(n => n.user_id === userId).sort((a, b) => {
      return new Date(b.updated_at) - new Date(a.updated_at);
    });
  },

  getNoteById: (id, userId) => {
    const data = readDatabase();
    return data.notes.find(n => n.id === id && n.user_id === userId);
  },

  updateNote: (id, userId, title, content) => {
    const data = readDatabase();
    const noteIndex = data.notes.findIndex(n => n.id === id && n.user_id === userId);
    if (noteIndex === -1) return null;
    
    data.notes[noteIndex].title = title;
    data.notes[noteIndex].content = content;
    data.notes[noteIndex].updated_at = new Date().toISOString();
    writeDatabase(data);
    return data.notes[noteIndex];
  },

  deleteNote: (id, userId) => {
    const data = readDatabase();
    const noteIndex = data.notes.findIndex(n => n.id === id && n.user_id === userId);
    if (noteIndex === -1) return false;
    
    data.notes.splice(noteIndex, 1);
    writeDatabase(data);
    return true;
  },

  // Profile operations
  updateUser: (id, name) => {
    const data = readDatabase();
    const userIndex = data.users.findIndex(u => u.id === id);
    if (userIndex === -1) return null;
    
    data.users[userIndex].name = name;
    writeDatabase(data);
    return data.users[userIndex];
  },

  updateUserPassword: (id, hashedPassword) => {
    const data = readDatabase();
    const userIndex = data.users.findIndex(u => u.id === id);
    if (userIndex === -1) return null;
    
    data.users[userIndex].password = hashedPassword;
    writeDatabase(data);
    return data.users[userIndex];
  },

  getNotesCountByUserId: (userId) => {
    const data = readDatabase();
    return data.notes.filter(n => n.user_id === userId).length;
  },

  updateUserProfileImage: (id, imagePath) => {
    const data = readDatabase();
    const userIndex = data.users.findIndex(u => u.id === id);
    if (userIndex === -1) return null;
    
    data.users[userIndex].profile_image = imagePath;
    writeDatabase(data);
    return data.users[userIndex];
  }
};

// Initialize on load
initDatabase();

module.exports = db;

