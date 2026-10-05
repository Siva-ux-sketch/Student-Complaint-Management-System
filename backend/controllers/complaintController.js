const Complaint = require("../models/Complaint");
const User = require("../models/User");
const AREAS = Complaint.AREAS;

function populateComplaint(query) {
  return query
    .populate("student", "name email studentId department")
    .populate("assignedTo", "name email role area")
    .populate("comments.user", "name role")
    .populate("statusHistory.changedBy", "name role");
}

function pushHistory(complaint, status, userId, note) {
  complaint.statusHistory.push({
    status,
    changedBy: userId,
    note: note || "",
  });
}

exports.createComplaint = async (req, res) => {
  try {
    const { title, description, category, location, area } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ message: "Title, description, and category are required." });
    }
    if (!area || !AREAS.includes(area)) {
      return res.status(400).json({ message: "Please select a valid campus area." });
    }

    const complaint = await Complaint.create({
      title,
      description,
      category,
      area,
      location: location || "",
      student: req.user._id,
      statusHistory: [
        {
          status: "Pending",
          changedBy: req.user._id,
          note: "Complaint filed — awaiting admin review",
        },
      ],
    });

    const populated = await populateComplaint(Complaint.findById(complaint._id));
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message || "Could not file complaint." });
  }
};

exports.getComplaints = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === "student") {
      filter.student = req.user._id;
    } else if (req.user.role === "staff") {
      filter.assignedTo = req.user._id;
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.area) filter.area = req.query.area;
    if (req.query.unassigned === "1" && req.user.role === "admin") {
      filter.assignedTo = null;
      filter.status = "Pending";
    }

    if (req.query.q) {
      const q = req.query.q.trim();
      if (q) {
        filter.$or = [
          { title: new RegExp(q, "i") },
          { description: new RegExp(q, "i") },
          { ticketId: new RegExp(q, "i") },
          { location: new RegExp(q, "i") },
          { area: new RegExp(q, "i") },
        ];
      }
    }

    const complaints = await populateComplaint(Complaint.find(filter).sort({ createdAt: -1 }));
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message || "Could not load complaints." });
  }
};

exports.getComplaint = async (req, res) => {
  try {
    const complaint = await populateComplaint(Complaint.findById(req.params.id));
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found." });
    }

    const isOwner = complaint.student._id.toString() === req.user._id.toString();
    const isAssignee =
      complaint.assignedTo && complaint.assignedTo._id.toString() === req.user._id.toString();
    if (req.user.role === "student" && !isOwner) {
      return res.status(403).json({ message: "You can only view your own complaints." });
    }
    if (req.user.role === "staff" && !isAssignee) {
      return res.status(403).json({ message: "You can only view complaints assigned to you." });
    }

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message || "Could not load complaint." });
  }
};

exports.routeComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found." });
    }
    if (complaint.status !== "Pending") {
      return res.status(400).json({ message: "Only pending complaints can be routed." });
    }

    const assignee = await User.findOne({ _id: req.body.assignedTo, role: "staff" });
    if (!assignee) {
      return res.status(400).json({ message: "Select a staff member for this area." });
    }
    if (req.body.area && AREAS.includes(req.body.area)) {
      complaint.area = req.body.area;
    }
    if (assignee.area && complaint.area && assignee.area !== complaint.area) {
      return res.status(400).json({ message: `Assign staff from the ${complaint.area} area.` });
    }

    complaint.assignedTo = assignee._id;
    complaint.status = "In Progress";
    pushHistory(
      complaint,
      "In Progress",
      req.user._id,
      `Admin reviewed and routed to ${assignee.area || assignee.name} staff`
    );
    await complaint.save();
    const populated = await populateComplaint(Complaint.findById(complaint._id));
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message || "Could not route complaint." });
  }
};

exports.updateComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found." });
    }

    if (["Withdrawn"].includes(complaint.status)) {
      return res.status(400).json({ message: "Withdrawn complaints cannot be updated." });
    }

    const { status } = req.body;
    const previousStatus = complaint.status;

    if (req.user.role === "staff") {
      if (!complaint.assignedTo || complaint.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "You can only update assigned complaints." });
      }
      if (status && !["In Progress", "Resolved", "Rejected"].includes(status)) {
        return res.status(400).json({ message: "Staff can set In Progress, Resolved, or Rejected." });
      }
      if (status) complaint.status = status;
    } else if (req.user.role === "admin") {
      if (status) complaint.status = status;
    }

    if (status && status !== previousStatus) {
      pushHistory(complaint, status, req.user._id, req.body.note || `Status changed to ${status}`);
    }

    await complaint.save();
    const populated = await populateComplaint(Complaint.findById(complaint._id));
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message || "Could not update complaint." });
  }
};

exports.withdrawComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found." });
    }

    if (complaint.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only withdraw your own complaints." });
    }

    if (complaint.status !== "Pending") {
      return res
        .status(400)
        .json({ message: "Only complaints awaiting admin review can be withdrawn." });
    }

    complaint.status = "Withdrawn";
    pushHistory(complaint, "Withdrawn", req.user._id, "Withdrawn by student before admin review");
    await complaint.save();

    const populated = await populateComplaint(Complaint.findById(complaint._id));
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message || "Could not withdraw complaint." });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required." });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found." });
    }

    if (complaint.status === "Withdrawn") {
      return res.status(400).json({ message: "Cannot comment on a withdrawn complaint." });
    }

    const isOwner = complaint.student.toString() === req.user._id.toString();
    const isAssignee =
      complaint.assignedTo && complaint.assignedTo.toString() === req.user._id.toString();
    if (req.user.role === "student" && !isOwner) {
      return res.status(403).json({ message: "You can only comment on your own complaints." });
    }
    if (req.user.role === "staff" && !isAssignee) {
      return res
        .status(403)
        .json({ message: "You can only comment on complaints assigned to you." });
    }

    complaint.comments.push({ user: req.user._id, text: text.trim() });
    await complaint.save();

    const populated = await populateComplaint(Complaint.findById(complaint._id));
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message || "Could not add comment." });
  }
};

exports.addFeedback = async (req, res) => {
  try {
    const rating = Number(req.body.rating);
    const note = (req.body.note || "").trim();
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Please choose a rating from 1 to 5." });
    }
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found." });
    if (complaint.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only rate your own complaints." });
    }
    if (complaint.status !== "Resolved") {
      return res.status(400).json({ message: "You can rate only resolved complaints." });
    }
    complaint.feedback = { rating, note, createdAt: new Date() };
    await complaint.save();
    const populated = await populateComplaint(Complaint.findById(complaint._id));
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message || "Could not save feedback." });
  }
};

const CATEGORIES = ["Academic", "Hostel", "Facilities", "Transport", "Fees", "Other"];

exports.getStats = async (req, res) => {
  try {
    const match = {};
    if (req.user.role === "student") match.student = req.user._id;
    if (req.user.role === "staff") match.assignedTo = req.user._id;

    const [total, pending, inProgress, resolved, rejected, withdrawn, unassigned, byCategory] =
      await Promise.all([
        Complaint.countDocuments(match),
        Complaint.countDocuments({ ...match, status: "Pending" }),
        Complaint.countDocuments({ ...match, status: "In Progress" }),
        Complaint.countDocuments({ ...match, status: "Resolved" }),
        Complaint.countDocuments({ ...match, status: "Rejected" }),
        Complaint.countDocuments({ ...match, status: "Withdrawn" }),
        req.user.role === "admin"
          ? Complaint.countDocuments({ status: "Pending", assignedTo: null })
          : Promise.resolve(0),
        Complaint.aggregate([
          { $match: match },
          { $group: { _id: "$category", value: { $sum: 1 } } },
        ]),
      ]);

    const categoryMap = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
    byCategory.forEach((row) => {
      if (row._id) categoryMap[row._id] = row.value;
    });

    res.json({
      total,
      pending,
      inProgress,
      resolved,
      rejected,
      withdrawn,
      unassigned,
      byStatus: [
        { name: "Pending", value: pending },
        { name: "In Progress", value: inProgress },
        { name: "Resolved", value: resolved },
        { name: "Rejected", value: rejected },
        { name: "Withdrawn", value: withdrawn },
      ],
      byCategory: CATEGORIES.map((name) => ({ name, value: categoryMap[name] || 0 })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Could not load stats." });
  }
};

exports.getActivity = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === "student") filter.student = req.user._id;
    if (req.user.role === "staff") filter.assignedTo = req.user._id;

    const complaints = await populateComplaint(Complaint.find(filter).sort({ updatedAt: -1 }).limit(40));
    const events = [];

    complaints.forEach((c) => {
      (c.statusHistory || []).forEach((h) => {
        events.push({
          id: `${c._id}-${h._id || h.createdAt}`,
          ticketId: c.ticketId,
          complaintCode: c.ticketId,
          complaintId: c._id,
          title: c.title,
          status: h.status,
          note: h.note || "",
          by: h.changedBy?.name || "System",
          createdAt: h.createdAt,
        });
      });
      (c.comments || []).forEach((cm) => {
        events.push({
          id: `${c._id}-cm-${cm._id}`,
          ticketId: c.ticketId,
          complaintCode: c.ticketId,
          complaintId: c._id,
          title: c.title,
          status: "Comment",
          note: cm.text,
          by: cm.user?.name || "User",
          createdAt: cm.createdAt,
        });
      });
    });

    events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(events.slice(0, 40));
  } catch (err) {
    res.status(500).json({ message: err.message || "Could not load activity." });
  }
};
