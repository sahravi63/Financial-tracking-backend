const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
require("dotenv").config();

const expenseController = require("./controllers/expenseController");
const User = require("./db/User");
const Expense = require("./db/Expense");
const expenseRoutes = require("./routes/expenseRoutes");
const authenticate = require("./middleware/authenticate");

const app = express();
const saltRounds = 10;

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);
app.use(bodyParser.json());
app.use(express.static("uploads")); // Serve uploaded files

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/expensesdb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Destination folder for uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"), false);
    }
  },
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Email transporter for password reset
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// Get all users endpoint
app.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "name email"); // Fetch all users, returning only the name and email fields
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});


// Register endpoint with validation
app.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Invalid email format"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/\d/)
      .withMessage("Password must contain a number")
      .matches(/[!@#$%^&*]/)
      .withMessage("Password must contain a special character"),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
      });

      await newUser.save();
      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.error("Registration error:", error);
      res
        .status(500)
        .json({ error: "Registration failed. Please try again later." });
    }
  }
);

// Login endpoint
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (isPasswordCorrect) {
      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
      return res
        .status(200)
        .json({ message: "Login successful", user: { ...user._doc, token } });
    } else {
      return res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      error: "Login failed due to server error. Please try again later.",
    });
  }
});

// Update profile endpoint
app.post(
  "/updateProfile",
  authenticate,
  upload.single("profilePic"),
  async (req, res) => {
    const { name } = req.body;
    const profilePic = req.file ? req.file.path : null; // Multer saves the file info in req.file

    try {
      const updateData = { name };
      if (profilePic) {
        updateData.profilePic = profilePic;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        updateData,
        { new: true }
      );
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res
        .status(200)
        .json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
);

// Fetch current user profile
app.get("/current-user", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ name: user.name, profilePic: user.profilePic });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

// Password Reset Request Route
app.post("/reset-password-request", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      text: `You requested a password reset. Click the following link to reset your password: ${resetUrl}`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send({ message: "Password reset email sent" });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Password Reset Route
app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).send({ error: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.status(200).send({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Use the expense routes
app.use("/api/expenses", authenticate, expenseRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
