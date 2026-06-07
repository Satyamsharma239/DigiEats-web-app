import express from "express";
import {
    adminLogin,
    getDashboardStats,
    getAllUsers,
    deleteUser,
    updateUserStatus,
    getAllShops,
    updateShopStatus,
    getAllOrders,
    updateOrderStatusAdmin,
    assignDeliveryBoyAdmin,
    getDetailedReports
} from "../controllers/admin.controllers.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Admin Authentication Middleware
const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
        if (!decoded.isAdmin) {
            return res.status(403).json({ success: false, message: "Access denied. Admin only." });
        }
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

// Routes
router.post("/login", adminLogin);

// Protected Admin Routes
router.get("/dashboard-stats", verifyAdmin, getDashboardStats);
router.get("/detailed-reports", verifyAdmin, getDetailedReports);

router.get("/users", verifyAdmin, getAllUsers);
router.delete("/users/:id", verifyAdmin, deleteUser);
router.put("/users/:id/status", verifyAdmin, updateUserStatus);

router.get("/shops", verifyAdmin, getAllShops);
router.put("/shops/:id/status", verifyAdmin, updateShopStatus);

router.get("/orders", verifyAdmin, getAllOrders);
router.put("/orders/status", verifyAdmin, updateOrderStatusAdmin);
router.put("/orders/assign-delivery-boy", verifyAdmin, assignDeliveryBoyAdmin);

export default router;
