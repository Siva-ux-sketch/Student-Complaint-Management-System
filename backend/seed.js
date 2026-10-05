require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Complaint = require("./models/Complaint");
const LoginRegister = require("./models/LoginRegister");

const DEMO_PASSWORD = "Campus@123";

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const existing = await db.listCollections().toArray();
  for (const col of existing) {
    await db.dropCollection(col.name);
    console.log(`Dropped collection: ${col.name}`);
  }

  await User.createCollection();
  await Complaint.createCollection();
  await LoginRegister.createCollection();
  console.log("Created collections: users, complaints, loginregisters");

  const password = await bcrypt.hash(DEMO_PASSWORD, 10);

  const admin = await User.create({
    name: "Campus Admin",
    email: "admin@campus.edu",
    password,
    role: "admin",
    accountStatus: "Active",
    area: "",
    department: "Administration",
  });

  const staffAreas = [
    ["library@campus.edu", "Library Staff", "Library"],
    ["ground@campus.edu", "Ground Staff", "Ground"],
    ["canteen@campus.edu", "Canteen Staff", "Canteen"],
    ["hostel@campus.edu", "Hostel Staff", "Hostel"],
    ["academic@campus.edu", "Academic Office", "Academic"],
    ["transport@campus.edu", "Transport Staff", "Transport"],
    ["facilities@campus.edu", "Facilities Staff", "Facilities"],
  ];

  const staffDocs = [];
  for (const [email, name, area] of staffAreas) {
    staffDocs.push(
      await User.create({
        name,
        email,
        password,
        role: "staff",
        area,
        accountStatus: "Active",
        department: area,
      })
    );
  }

  const sampleStudents = [
    ["Aisha Student", "student@campus.edu", "STU-1024", "Computer Science"],
    ["Rahul Kumar", "rahul@campus.edu", "STU-1025", "Electronics"],
    ["Meera Patel", "meera@campus.edu", "STU-1026", "Mechanical"],
  ];

  const students = [];
  for (const [name, email, studentId, department] of sampleStudents) {
    students.push(
      await User.create({
        name,
        email,
        password,
        role: "student",
        accountStatus: "Active",
        studentId,
        department,
      })
    );
  }

  for (const user of [admin, ...staffDocs, ...students]) {
    await LoginRegister.create({
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
  }

  const student = students[0];
  await Complaint.create({
    title: "Broken AC in Library reading hall",
    description: "The air conditioner near the exam section has not been working for two days.",
    location: "Main Library, Floor 2",
    category: "Facilities",
    area: "Library",
    status: "Pending",
    student: student._id,
    statusHistory: [{ status: "Pending", note: "Complaint filed", changedBy: student._id }],
  });

  await Complaint.create({
    title: "Hostel Wi-Fi outage in Block B",
    description: "Internet has been unavailable in Block B common room since yesterday evening.",
    location: "Hostel Block B",
    category: "Hostel",
    area: "Hostel",
    status: "In Progress",
    student: student._id,
    assignedTo: staffDocs.find((s) => s.area === "Hostel")?._id,
    statusHistory: [
      { status: "Pending", note: "Complaint filed", changedBy: student._id },
      { status: "In Progress", note: "Assigned to hostel staff", changedBy: admin._id },
    ],
  });

  const cols = await db.listCollections().toArray();
  console.log("\nActive collections:", cols.map((c) => c.name).join(", "));
  console.log(`users: ${await User.countDocuments()}`);
  console.log(`complaints: ${await Complaint.countDocuments()}`);
  console.log(`loginregisters: ${await LoginRegister.countDocuments()}`);
  console.log("\n========== ADMIN LOGIN ==========");
  console.log("Email:    admin@campus.edu");
  console.log("Password: Campus@123");
  console.log("=================================");
  console.log("Students can Create account many times (unique email each).");
  console.log("Sample students: student@campus.edu, rahul@campus.edu, meera@campus.edu");
  console.log("Same password:", DEMO_PASSWORD);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
