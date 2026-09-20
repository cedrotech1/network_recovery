const express = require("express");
const { login, changePassword, getMe, listUsers, createUser } = require("../controllers/authController.js");
const { protect } = require("../middlewares/protect.js");
const { requireAdmin } = require("../middlewares/roleAccess.js");

const router = express.Router();

router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);
router.get("/users", protect, requireAdmin, listUsers);
router.post("/users", protect, requireAdmin, createUser);

module.exports = router;
