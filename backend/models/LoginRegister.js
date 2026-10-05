const mongoose = require("mongoose");

/** Records every Sign in / Create account action from the auth page (for Compass + audit). */
const loginRegisterSchema = new mongoose.Schema(
  {
    action: { type: String, enum: ["login", "register"], required: true },
    name: { type: String, trim: true, default: "" },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ["student", "staff", "admin"], required: true },
    area: { type: String, trim: true, default: "" },
    studentId: { type: String, trim: true, default: "" },
    department: { type: String, trim: true, default: "" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    success: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("LoginRegister", loginRegisterSchema);
