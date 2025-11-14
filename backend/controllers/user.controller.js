import jwt from 'jsonwebtoken';
import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import ApiError from "../utils/apiError.js";

// Generate JWT
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not defined in environment");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Register User
export const registerUser = asyncHandler(async (req, res) => {
  let { name, email, password, orgName } = req.body;

  email = email?.trim().toLowerCase();
  name = name?.trim();
  orgName = orgName?.trim();

  if (!email || !password || !name) {
    throw new ApiError(400, "email, password and name are required fields!");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new ApiError(400, "User already exists!");
  }

  const user = await User.create({ name, email, password, orgName });

  res.status(201).json({
    success: true,
    message: "User Registered Successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      orgName: user.orgName,
      role: user.role,
    },
    token: generateToken(user._id),
  });
});

// Login User
export const loginUser = asyncHandler(async (req, res) => {
  let { email, password } = req.body;

  email = email?.trim().toLowerCase();

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required fields!");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "Invalid Credentials");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(400, "Invalid Credentials");
  }

  user.lastLogin = new Date();
  await user.save();

  res.status(200).json({
    success: true,
    message: "User Logged-In Successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      orgName: user.orgName,
    },
    token: generateToken(user._id),
  });
});

// Get User Profile
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// Update User Profile
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, orgName } = req.body;

  if (name === undefined && orgName === undefined) {
    throw new ApiError(400, "Nothing to update");
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (name) user.name = name.trim();
  if (orgName !== undefined) user.orgName = orgName.trim();

  await user.save();

  res.status(200).json({
    success: true,
    message: "User Profile updated successfully",
    user: {
      id: user._id,
      name: user.name,
      orgName: user.orgName,
      role: user.role,
      email: user.email,
    },
  });
});

// Generate user's own API key
export const generateUserApiKey = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const apiKey = user.generateApiKey();
  await user.save();

  res.status(200).json({
    success: true,
    message: "API Key generated successfully",
    apiKey,
  });
});

// Change Password
export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "oldPassword and newPassword are required");
  }

  if (oldPassword === newPassword) {
    throw new ApiError(400, "New password must be different from old password");
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    throw new ApiError(400, "Old password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});

// Get all users (Admin)
export const getAllUsers = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, role, isActive, search } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  const query = {};

  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === "true";

  if (search) {
    const regex = new RegExp(search, "i");
    query.$or = [{ name: regex }, { email: regex }];
  }

  const skip = (page - 1) * limit;

  const [users, totalUsers] = await Promise.all([
    User.find(query)
      .select("-password -apiKey")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),

    User.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: users.length,
    page,
    totalPages: Math.ceil(totalUsers / limit),
    totalUsers,
    users,
  });
});

// Get Single User (Admin)
export const getSingleUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password -apiKey");

  if (!user) throw new ApiError(404, "User not found");

  res.status(200).json({
    success: true,
    user,
  });
});

// Update User Role (Admin)
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!role) throw new ApiError(400, "Role is required");

  const allowedRoles = ["admin", "developer", "viewer"];
  if (!allowedRoles.includes(role)) {
    throw new ApiError(400, "Invalid role given");
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  if (user._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, "You cannot change your own role");
  }

  user.role = role;
  await user.save();

  res.status(200).json({
    success: true,
    message: "User role updated",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      orgName: user.orgName,
    },
  });
});

// Toggle User Active/Inactive (Admin)
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) throw new ApiError(404, "User not found");

  if (user._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, "You cannot change your own status");
  }

  user.isActive = !user.isActive;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User is now ${user.isActive ? "active" : "inactive"}`,
  });
});

// Admin regenerate API key for any user
export const adminRegenerateApiKey = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) throw new ApiError(404, "User not found");

  if (req.user._id.toString() === user._id.toString()) {
    throw new ApiError(400, "Use your own /generate-api-key endpoint instead");
  }

  const newKey = user.generateApiKey();
  await user.save();

  res.status(200).json({
    success: true,
    message: "API key regenerated successfully",
    apiKey: newKey,
  });
});
