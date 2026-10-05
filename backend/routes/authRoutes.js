const express = require("express");
const { register, login, me, listStaff } = require("../controllers/authController");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);
router.get("/staff", protect, allowRoles("admin"), listStaff);

module.exports = router;
