const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../database/models");

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function toPublicUser(user) {
  const json = typeof user.toJSON === "function" ? user.toJSON() : { ...user };
  delete json.password;
  return json;
}

const login = async (req, res) => {
  try {
    const email = (req.body.email || req.body.urEmail || "").trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password" });
    }

    const user = await db.User.findOne({ where: { email } });
    if (!user || String(user.deleted || "").toLowerCase() === "yes") {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.active) {
      return res.status(400).json({ success: false, message: "Your account is not active" });
    }

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token: generateToken(user.id),
      user: toPublicUser(user),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res) => {
  const user = await db.User.findByPk(req.user.id, {
    attributes: { exclude: ["password"] },
  });
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  return res.status(200).json({ success: true, data: user });
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: "Please provide all password fields" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const user = await db.User.findByPk(req.user.id);
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const listUsers = async (req, res) => {
  const data = await db.User.findAll({
    attributes: { exclude: ["password"] },
    order: [["createdAt", "DESC"]],
  });
  return res.json({ success: true, data });
};

const createUser = async (req, res) => {
  try {
    const { names, email, password, role, phone } = req.body;
    if (!names || !email || !password) {
      return res.status(400).json({ success: false, message: "names, email and password are required" });
    }
    const existing = await db.User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }
    const user = await db.User.create({
      names,
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, 10),
      role: role || "admin",
      phone: phone || null,
      active: true,
    });
    return res.status(201).json({ success: true, data: toPublicUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  login,
  getMe,
  changePassword,
  listUsers,
  createUser,
};
