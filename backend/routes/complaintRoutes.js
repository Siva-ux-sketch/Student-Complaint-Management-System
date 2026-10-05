const express = require("express");
const {
  createComplaint,
  getComplaints,
  getComplaint,
  updateComplaint,
  addComment,
  getStats,
  getActivity,
  withdrawComplaint,
  routeComplaint,
  addFeedback,
} = require("../controllers/complaintController");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/stats", getStats);
router.get("/activity", getActivity);
router.post("/", allowRoles("student"), createComplaint);
router.get("/", getComplaints);
router.get("/:id", getComplaint);
router.patch("/:id", allowRoles("admin", "staff"), updateComplaint);
router.post("/:id/route", allowRoles("admin"), routeComplaint);
router.post("/:id/withdraw", allowRoles("student"), withdrawComplaint);
router.post("/:id/comments", addComment);
router.post("/:id/feedback", allowRoles("student"), addFeedback);

module.exports = router;
