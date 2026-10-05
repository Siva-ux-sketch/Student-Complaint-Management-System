const mongoose = require("mongoose");

const AREAS = ["Library", "Ground", "Canteen", "Hostel", "Academic", "Transport", "Facilities"];

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, trim: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

function makeTicketId() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `CMP-${stamp}${rand}`;
}

const complaintSchema = new mongoose.Schema(
  {
    ticketId: { type: String, unique: true, sparse: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    location: { type: String, trim: true, default: "" },
    category: {
      type: String,
      enum: ["Academic", "Hostel", "Facilities", "Transport", "Fees", "Other"],
      required: true,
    },
    area: { type: String, enum: AREAS, required: true },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Rejected", "Withdrawn"],
      default: "Pending",
    },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    comments: [commentSchema],
    statusHistory: [statusHistorySchema],
    feedback: {
      rating: Number,
      note: String,
      createdAt: Date,
    },
  },
  { timestamps: true }
);

complaintSchema.pre("validate", function assignTicketId(next) {
  if (!this.ticketId) this.ticketId = makeTicketId();
  next();
});

const Complaint = mongoose.model("Complaint", complaintSchema);
Complaint.AREAS = AREAS;
module.exports = Complaint;
