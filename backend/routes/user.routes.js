import express from "express";
import { registerUser, 
    loginUser, 
    getUserProfile ,
    updateUserProfile,
    changePassword, 
    getAllUsers,
    getSingleUser,
    updateUserRole,
    toggleUserStatus,
    adminRegenerateApiKey
} from "../controllers/user.controller.js";
import { authLimiter } from "../middleware/rateLimiters.js";

import { protect,isAdmin } from "../middleware/authMiddleware.js";
import { generateUserApiKey } from "../controllers/user.controller.js";

const router = express.Router();

// public
router.post("/register",authLimiter, registerUser);
router.post("/login",authLimiter, loginUser);

// protected
router.get("/profile", protect, getUserProfile);
router.patch("/update-profile", protect, updateUserProfile);
router.patch("/change-password", protect, changePassword);


//Admin
router.get("/", protect, isAdmin, getAllUsers);

router.get("/:id", protect, isAdmin, getSingleUser);

router.patch("/:id/role", protect, isAdmin, updateUserRole);

router.patch("/:id/toggle-status", protect, isAdmin, toggleUserStatus);

router.post("/:id/regenerate-api-key", protect, isAdmin, adminRegenerateApiKey);



//generates api key
router.post("/generate-api-key", protect, generateUserApiKey);




export default router;
