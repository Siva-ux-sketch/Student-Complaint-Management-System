const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const LoginRegister = require("../models/LoginRegister");

async function recordAuthEvent(payload) {
  try {
    await LoginRegister.create(payload);
  } catch (err) {
    console.error("LoginRegister log failed:", err.message);
  }
}

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function isStrongPassword(password = "") {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    area: user.area || "",
    accountStatus: user.accountStatus || "Active",
    studentId: user.studentId || "",
    department: user.department || "",
    createdAt: user.createdAt,
  };
}

const AREAS = ["Library", "Ground", "Canteen", "Hostel", "Academic", "Transport", "Facilities"];

exports.register = async (req, res) => {
  try {
    const { name, email, password, studentId, department, role, area } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password needs 8+ chars with upper, lower, number, and special character.",
      });
    }

    const allowedRoles = ["student", "staff", "admin"];
    const selectedRole = allowedRoles.includes(role) ? role : "student";

    if (selectedRole === "staff" && (!area || !AREAS.includes(area))) {
      return res.status(400).json({ message: "Staff must select a campus area." });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: selectedRole,
      area: selectedRole === "staff" ? area : "",
      accountStatus: "Active",
      studentId: selectedRole === "student" ? studentId || "" : "",
      department: department || (selectedRole === "staff" ? area : ""),
    });

    await recordAuthEvent({
      action: "register",
      name: user.name,
      email: user.email,
      role: user.role,
      area: user.area || "",
      studentId: user.studentId || "",
      department: user.department || "",
      userId: user._id,
      success: true,
    });

    res.status(201).json({
      token: signToken(user._id),
      user: publicUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Registration failed." });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    await recordAuthEvent({
      action: "login",
      name: user.name,
      email: user.email,
      role: user.role,
      area: user.area || "",
      studentId: user.studentId || "",
      department: user.department || "",
      userId: user._id,
      success: true,
    });

    res.json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message || "Login failed." });
  }
};

exports.me = async (req, res) => {
  res.json({ user: publicUser(req.user) });
};

exports.listStaff = async (req, res) => {
  try {
    const filter = { role: "staff", accountStatus: "Active" };
    if (req.query.area) filter.area = req.query.area;
    const staff = await User.find(filter).select("name email role area department");
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message || "Could not load staff." });
  }
};
