const mongoose = require("mongoose");

const AREAS = ["Library", "Ground", "Canteen", "Hostel", "Academic", "Transport", "Facilities"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "staff", "admin"], default: "student" },
    area: { type: String, trim: true, default: "" },
    accountStatus: {
      type: String,
      enum: ["Pending", "Active", "Rejected"],
      default: "Active",
    },
    studentId: { type: String, trim: true },
    department: { type: String, trim: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
User.AREAS = AREAS;
module.exports = User;
