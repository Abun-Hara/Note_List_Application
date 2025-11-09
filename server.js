const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const db = require('./database');

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Configure multer for image uploads
const uploadsDir = path.join(__dirname, 'uploads', 'profile-images');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user ? req.user.userId : Date.now();
    const ext = path.extname(file.originalname);
    const filename = `profile-${userId}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/auth.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'auth.html'));
});

app.get('/profile.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// Authentication routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = db.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = db.createUser(name, email, hashedPassword);
    const userId = user.id;

    // Generate token
    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      userId,
      name,
      message: 'Account created successfully'
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find user
    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      userId: user.id,
      name: user.name,
      message: 'Signed in successfully'
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
  const user = db.getUserById(req.user.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
});

// Profile routes
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    const user = db.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const notesCount = db.getNotesCountByUserId(req.user.userId);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        profile_image: user.profile_image || null
      },
      stats: {
        totalNotes: notesCount
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const updatedUser = db.updateUser(req.user.userId, name.trim());
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

app.put('/api/auth/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    // Get user
    const user = db.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const updatedUser = db.updateUserPassword(req.user.userId, hashedPassword);
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

// Profile image upload
app.post('/api/auth/profile/image', authenticateToken, upload.single('profileImage'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    // Get user to check for old image
    const user = db.getUserById(req.user.userId);
    if (!user) {
      // Delete uploaded file if user not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete old profile image if exists
    if (user.profile_image) {
      const oldImagePath = path.join(__dirname, user.profile_image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Save new image path (relative to public/uploads)
    const imagePath = `/uploads/profile-images/${req.file.filename}`;
    const updatedUser = db.updateUserProfileImage(req.user.userId, imagePath);

    if (!updatedUser) {
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ success: false, message: 'Failed to update profile image' });
    }

    res.json({
      success: true,
      imagePath: imagePath,
      message: 'Profile image updated successfully'
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: 'Failed to upload profile image' });
  }
});

// Notes routes (protected)
app.get('/api/notes', authenticateToken, (req, res) => {
  try {
    const notes = db.getNotesByUserId(req.user.userId);
    res.json(notes);
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
});

app.post('/api/notes', authenticateToken, (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content required' });
    }

    const note = db.createNote(req.user.userId, title, content);
    res.status(201).json(note);
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ message: 'Failed to create note' });
  }
});

app.put('/api/notes/:id', authenticateToken, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content required' });
    }

    // Check if note belongs to user
    const note = db.getNoteById(id, req.user.userId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Update note
    const updatedNote = db.updateNote(id, req.user.userId, title, content);
    if (!updatedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json(updatedNote);
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ message: 'Failed to update note' });
  }
});

app.delete('/api/notes/:id', authenticateToken, (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Check if note belongs to user
    const note = db.getNoteById(id, req.user.userId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Delete note
    const deleted = db.deleteNote(id, req.user.userId);
    if (!deleted) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json({ message: `Note ${id} deleted.` });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ message: 'Failed to delete note' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📝 Database initialized: database.json`);
});
