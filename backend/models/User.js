const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  pacsId: { type: String, unique: true, sparse: true },
  pacsName: { type: String },
  district: { type: String },
  location: { type: String },
  // ✅ IMPORTANT CHANGE: Add "superadmin" to the enum
  userType: { type: String, enum: ["admin", "user", "pacs", "superadmin"], default: "user" },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
