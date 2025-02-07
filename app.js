require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');


const noteRoutes = require('./routes/noteRoutes'); // New note routes
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
app.use(express.json());
app.use(cors());


// Add this after your middleware setup
app.use('/notes', noteRoutes);




// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// At the top of your file, add JWT secret validation
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not defined in environment variables');
  throw new Error('JWT_SECRET must be defined');
}

// User Schema remains the same
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model('User', UserSchema);

// Signup Route remains the same
app.post('/signup', async (req, res) => {
  try {
    console.log('Signup attempt for email:', req.body.email);
    const { name, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Signup failed: Email already exists:', email);
      return res.status(400).json({ error: "Email already exists" });
    }

    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    const user = new User({ 
      name, 
      email, 
      password: hashedPassword 
    });

    await user.save();
    console.log('User saved successfully:', user._id);
    res.json({ 
      message: "User registered successfully",
      timestamp: user.createdAt
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Modified Login Route with JWT secret validation
app.post('/login', async (req, res) => {
  try {
    console.log('Login attempt for email:', req.body.email);
    const { email, password, rememberMe } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: User not found for email:', email);
      return res.status(400).json({ error: "User not found" });
    }
    console.log('User found:', user._id);

    console.log('Comparing passwords...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      console.log('Login failed: Invalid password for user:', user._id);
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Validate JWT_SECRET before using it
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing');
      return res.status(500).json({ error: "Server configuration error" });
    }

    console.log('Generating token with rememberMe:', rememberMe);
    const expiresIn = rememberMe ? '7d' : '1h';
    
    // Log JWT secret presence (don't log the actual secret)
    console.log('JWT_SECRET is present:', !!process.env.JWT_SECRET);
    
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET,
      { expiresIn }
    );
    
    console.log('Token generated successfully');

    user.updatedAt = Date.now();
    await user.save();

    res.json({ 
      token, 
      user: { 
        name: user.name, 
        email: user.email,
        lastLogin: user.updatedAt 
      } 
    });
  } catch (err) {
    console.error('Login error:', err.stack);  // Log full error stack
    res.status(500).json({ 
      error: "Server error", 
      details: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});





// Modified Verify Token middleware
const verifyToken = (req, res, next) => {
  try {
    console.log('Verifying token...');
    const token = req.header("Authorization");
    
    if (!token) {
      console.log('Token verification failed: No token provided');
      return res.status(401).json({ error: "Access Denied" });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing in token verification');
      return res.status(500).json({ error: "Server configuration error" });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified successfully for user:', verified.id);
    req.user = verified;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(400).json({ error: "Invalid Token" });
  }
};

// Protected Route Example
app.get('/dashboard', verifyToken, (req, res) => {
  res.json({ message: "Welcome to the dashboard", userId: req.user.id });
});





// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
