const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();
const cors = require("cors");

const app = express();

// ✅ CORS Setup (supports both deployed and local frontend)
const allowedOrigins = [
  "https://nectar-infotel-live.onrender.com",
  "http://localhost:5173"
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

// ✅ Body parser middleware for JSON
app.use(express.json({ limit: "10mb" }));

// ✅ Import Routes
const authRoutes = require("./routes/authRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminDataDownloadFilter = require("./routes/adminDataDownloadFilter");

// ✅ Use Routes with /api prefix
app.use("/api", authRoutes);
app.use("/api", submissionRoutes);  // includes /api/erp-submission
app.use("/api", adminRoutes);
app.use("/api/admin", adminDataDownloadFilter);

// ✅ Root test route
app.get("/", (req, res) => {
  res.send("✅ Nectar API is running...");
});

// ✅ Optional: Hide MONGO_URI in production logs
if (process.env.NODE_ENV !== "production") {
  console.log("🔍 MONGO_URI:", process.env.MONGO_URI);
}

// ✅ MongoDB connection and server start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully!");
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

// ✅ 404 Fallback for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});