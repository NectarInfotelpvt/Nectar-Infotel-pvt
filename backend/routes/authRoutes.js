const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt"); // ✅ Add bcrypt
const User = require("../models/User");
const ImageKit = require("imagekit");

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// GET /auth/imagekit-auth - Generates authentication parameters for ImageKit client-side uploads
router.get("/auth/imagekit-auth", (req, res) => {
  const auth = imagekit.getAuthenticationParameters();
  res.json(auth);
});

// POST /api/register - Registers a new user
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create new user (userType will default to 'user' as per your User model)
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    // 4. Send response like login (auto-login after registration)
    res.status(201).json({
      message: "User registered successfully.",
      userType: newUser.userType, // Send the actual user type
      userId: newUser._id,
      name: newUser.name,
      email: newUser.email,
    });
  } catch (err) {
    console.error("Registration failed:", err); // Log the full error
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
});


// POST /api/login - Authenticates user and returns their type for frontend routing
router.post("/login", async (req, res) => {
  const { loginId, password } = req.body; // loginId can be email or pacsId

  try {
    // 1. Find user by email or pacsId
    const user = await User.findOne({
      $or: [{ email: loginId }, { pacsId: loginId }],
    });

    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    // 2. Compare provided password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    // 3. If authentication successful, return specific user details, including userType
    res.status(200).json({
      message: "Login successful",
      user: { // Nest user details under a 'user' object for consistency
        userId: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType, // ✅ THIS IS THE KEY for frontend routing (e.g., 'admin', 'superadmin', 'pacs', 'user')
        // You can add more user-specific fields here if needed
      },
    });
  } catch (err) {
    console.error("Login failed:", err); // Log the full error
    res.status(500).json({ error: "Login failed", details: err.message });
  }
});

module.exports = router;
