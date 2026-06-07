import Admin from "../models/admin.model.js";
import User from "../models/user.model.js";
import Shop from "../models/shop.model.js";
import Order from "../models/order.model.js";
import DeliveryAssignment from "../models/deliveryAssignment.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendAdminAlertMail } from "../utils/mail.js";

// 1. Admin Login
export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: admin._id, role: admin.role, isAdmin: true },
            process.env.JWT_SECRET || "fallback_secret",
            { expiresIn: "7d" }
        );

        // Async email sending without awaiting to not block login response
        sendAdminAlertMail(admin.email, req.ip || "Unknown IP", new Date().toLocaleString());

        res.status(200).json({
            success: true,
            message: "Welcome Admin",
            token,
            admin: {
                _id: admin._id,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 2. Get Dashboard Stats
export const getDashboardStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = {};

        if (startDate && endDate) {
            dateFilter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else if (startDate) {
            dateFilter.createdAt = { $gte: new Date(startDate) };
        } else if (endDate) {
            dateFilter.createdAt = { $lte: new Date(endDate) };
        }

        const totalUsers = await User.countDocuments({ role: "user", ...dateFilter });
        const totalOwners = await User.countDocuments({ role: "owner", ...dateFilter });
        const totalDeliveryBoys = await User.countDocuments({ role: "deliveryBoy", ...dateFilter });
        const totalShops = await Shop.countDocuments(dateFilter);
        const totalOrders = await Order.countDocuments(dateFilter);

        // Calculate total revenue from delivered shop orders
        const allOrders = await Order.find(dateFilter);
        let grossPlatformRevenue = 0;

        allOrders.forEach(order => {
            if (order && Array.isArray(order.shopOrders)) {
                order.shopOrders.forEach(shopOrder => {
                    if (shopOrder && shopOrder.status === "delivered") {
                        grossPlatformRevenue += (shopOrder.subtotal || 0);
                    }
                });
            }
        });

        // Let's assume a standard 10% platform commission for display purposes 
        const platformRevenue = grossPlatformRevenue * 0.10;

        res.status(200).json({
            success: true,
            stats: {
                users: totalUsers,
                owners: totalOwners,
                deliveryBoys: totalDeliveryBoys,
                shops: totalShops,
                orders: totalOrders,
                grossRevenue: grossPlatformRevenue,
                platformRevenue: platformRevenue
            }
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ success: false, message: "Error fetching dashboard stats" });
    }
};

// 3. Get All Users (Filtered by role)
export const getAllUsers = async (req, res) => {
    try {
        const { role } = req.query; // optional filter
        let query = {};
        if (role) {
            query.role = role;
        }

        const users = await User.find(query).select("-password").sort({ createdAt: -1 });
        res.status(200).json({ success: true, users });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ success: false, message: "Error fetching users" });
    }
};

// 4. Delete/Block User
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ success: false, message: "Error deleting user" });
    }
};

// 4b. Block/Unblock User
export const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isBlocked } = req.body;

        const user = await User.findByIdAndUpdate(id, { isBlocked }, { new: true });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`, user });
    } catch (error) {
        console.error("Error updating user status:", error);
        res.status(500).json({ success: false, message: "Error updating user status" });
    }
};

// 5. Get All Shops (with owner info)
export const getAllShops = async (req, res) => {
    try {
        const shops = await Shop.find().populate("owner", "fullName email mobile").sort({ createdAt: -1 });
        res.status(200).json({ success: true, shops });
    } catch (error) {
        console.error("Error fetching shops:", error);
        res.status(500).json({ success: false, message: "Error fetching shops" });
    }
};

// 6. Approve/Reject Shop (Update verified status if applicable, otherwise logic can be adapted)
export const updateShopStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body; // Assuming 'isActive' flags if a shop is allowed to be open on the platform

        const shop = await Shop.findByIdAndUpdate(id, { isActive }, { new: true });
        if (!shop) {
            return res.status(404).json({ success: false, message: "Shop not found" });
        }
        res.status(200).json({ success: true, message: "Shop status updated", shop });
    } catch (error) {
        console.error("Error updating shop:", error);
        res.status(500).json({ success: false, message: "Error updating shop status" });
    }
};

// 7. Get All Orders
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "fullName mobile")
            .populate("shopOrders.shop", "name")
            .populate("shopOrders.assignedDeliveryBoy", "fullName mobile")
            .sort({ createdAt: -1 })
            .limit(200);

        const flattenedOrders = [];
        for (const order of orders) {
            if (!order || !Array.isArray(order.shopOrders)) continue;
            for (const shopOrder of order.shopOrders) {
                if (!shopOrder) continue;
                flattenedOrders.push({
                    _id: shopOrder._id ? shopOrder._id.toString() : order._id.toString(),
                    parentOrderId: order._id,
                    totalAmount: shopOrder.subtotal || order.totalAmount,
                    createdAt: order.createdAt,
                    userId: order.user || null,
                    shopId: shopOrder.shop || null,
                    deliveryBoyId: shopOrder.assignedDeliveryBoy || null,
                    orderStatus: shopOrder.status || 'pending'
                });
            }
        }
        res.status(200).json({ success: true, orders: flattenedOrders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ success: false, message: "Error fetching orders" });
    }
};

// 8. Admin Update Order Status
export const updateOrderStatusAdmin = async (req, res) => {
    try {
        const { parentOrderId, shopId, status } = req.body;

        if (!parentOrderId || !shopId || !status) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const order = await Order.findById(parentOrderId).populate("user");
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Find the specific shopOrder to update
        const shopOrder = order.shopOrders.find(so => so.shop.toString() === shopId.toString());

        if (!shopOrder) {
            return res.status(404).json({ success: false, message: "Shop order not found within parent order" });
        }

        const currentStatus = status.toLowerCase();
        shopOrder.status = status;

        if (currentStatus === "delivered") {
            shopOrder.deliveredAt = Date.now();
        }

        // IF STATUS IS SET TO DELIVERED OR CANCELLED BY ADMIN, WE MUST FREE THE DELIVERY BOY
        if (currentStatus === "delivered" || currentStatus === "cancelled") {
            // Emitting event globally so the correct Delivery Boy catches it regardless of disjointed socket IDs
            const io = req.app.get('io')
            if (io) {
                io.emit('deliveryCompletedByOwner', { orderId: order._id })
            }

            if (shopOrder.assignment) {
                await DeliveryAssignment.deleteOne({ _id: shopOrder.assignment });

                // Keep the record of who delivered it, but clear the active assignment reference
                shopOrder.assignment = undefined;
            }
        }

        await order.save();

        // Notify User and Shop via Sockets
        const io = req.app.get('io');
        if (io) {
            // Notify User
            if (order.user && order.user.socketId) {
                io.to(order.user.socketId).emit('update-status', {
                    orderId: order._id,
                    shopId: shopOrder.shop,
                    status: status,
                    userId: order.user._id
                });
            }

            // Notify Owner
            const shopDoc = await Shop.findById(shopOrder.shop).populate("owner");
            if (shopDoc && shopDoc.owner && shopDoc.owner.socketId) {
                io.to(shopDoc.owner.socketId).emit('update-status', {
                    orderId: order._id,
                    shopId: shopDoc._id,
                    status: status
                });
            }

            // Notify Assigned Delivery Boy
            if (shopOrder.assignedDeliveryBoy) {
                const boy = await User.findById(shopOrder.assignedDeliveryBoy);
                if (boy && boy.socketId) {
                    io.to(boy.socketId).emit('update-status', {
                        orderId: order._id,
                        shopId: shopOrder.shop,
                        status: status
                    });
                }
            }
        }

        res.status(200).json({ success: true, message: `Order status updated to ${status} by Admin`, shopOrder });
    } catch (error) {
        console.error("Error updating admin order status:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// 9. Admin Manual Delivery Assignment
export const assignDeliveryBoyAdmin = async (req, res) => {
    try {
        const { parentOrderId, shopId, deliveryBoyId } = req.body;

        if (!parentOrderId || !shopId || !deliveryBoyId) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const order = await Order.findById(parentOrderId).populate("user").populate("shopOrders.shop");
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const shopOrder = order.shopOrders.find(so => so.shop._id.toString() === shopId.toString() || so.shop.toString() === shopId.toString());
        if (!shopOrder) {
            return res.status(404).json({ success: false, message: "Shop order not found" });
        }

        const deliveryBoy = await User.findById(deliveryBoyId);
        if (!deliveryBoy || deliveryBoy.role !== "deliveryBoy") {
            return res.status(400).json({ success: false, message: "Invalid delivery boy" });
        }

        // Prevent assignment for delivered or cancelled orders
        if (shopOrder.status === "delivered" || shopOrder.status === "cancelled") {
            return res.status(400).json({ success: false, message: `Cannot change delivery partner for a ${shopOrder.status} order.` });
        }

        const oldDeliveryBoyId = shopOrder.assignedDeliveryBoy;

        // Update Order
        shopOrder.assignedDeliveryBoy = deliveryBoyId;

        // Handle Assignment Record
        if (shopOrder.assignment) {
            await DeliveryAssignment.deleteOne({ _id: shopOrder.assignment });
        }

        const newAssignment = await DeliveryAssignment.create({
            order: order._id,
            shop: shopOrder.shop._id || shopOrder.shop,
            shopOrderId: shopOrder._id,
            assignedTo: deliveryBoyId,
            status: "assigned",
            acceptedAt: new Date()
        });

        shopOrder.assignment = newAssignment._id;
        await order.save();

        const io = req.app.get('io');
        if (io) {
            // 1. Notify the NEW delivery boy
            const boySocketId = deliveryBoy.socketId;
            if (boySocketId) {
                io.to(boySocketId).emit('newAssignment', {
                    sentTo: deliveryBoyId,
                    assignmentId: newAssignment._id,
                    orderId: order._id,
                    shopName: shopOrder.shop.name || "Restaurant",
                    deliveryAddress: order.deliveryAddress,
                    items: shopOrder.shopOrderItems || [],
                    subtotal: shopOrder.subtotal
                });
            }

            // 2. Notify the OLD delivery boy (if any) to clear their screen
            if (oldDeliveryBoyId && oldDeliveryBoyId.toString() !== deliveryBoyId.toString()) {
                io.emit('deliveryCompletedByOwner', { orderId: order._id }); // This event is already used for clearing screens
            }

            // 3. Notify User & Owner about the change
            if (order.user?.socketId) {
                io.to(order.user.socketId).emit('update-status', { orderId: order._id, status: shopOrder.status });
            }
        }

        res.status(200).json({ success: true, message: "Delivery boy assigned successfully", assignedDeliveryBoy: deliveryBoy });
    } catch (error) {
        console.error("Error assigning delivery boy:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// New getDetailedReports for comprehensive reporting
export const getDetailedReports = async (req, res) => {
    try {
        const { startDate, endDate, city } = req.query;

        // 1. Build initial match stage based on date and optionally city for Order
        let orderMatchStage = {};
        if (startDate && endDate) {
            orderMatchStage.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else if (startDate) {
            orderMatchStage.createdAt = { $gte: new Date(startDate) };
        } else if (endDate) {
            orderMatchStage.createdAt = { $lte: new Date(endDate) };
        }

        let shopMatchStage = {};
        if (city && city.trim() !== "") {
            shopMatchStage = { "city": { $regex: new RegExp(`^${city}$`, "i") } }
        }

        // Filter valid shops based on City
        const validShops = await Shop.find(shopMatchStage).select('_id name');
        const validShopIds = validShops.map(s => s._id);

        if (city && city.trim() !== "") {
            orderMatchStage["shopOrders.shop"] = { $in: validShopIds };
        }

        // Calculate Overall Totals depending on City filter
        let totalRestaurantsCount = 0;
        let totalUsersCount = 0;
        let totalDishesCount = 0;

        // Count total shops in selected city (or all if no city)
        totalRestaurantsCount = await Shop.countDocuments(shopMatchStage);

        // Count total unique users who ordered in that city/time
        const userCountPipeline = [
            { $match: orderMatchStage },
            { $group: { _id: "$user" } },
            { $count: "total" }
        ];
        const userCountResult = await Order.aggregate(userCountPipeline);
        totalUsersCount = userCountResult.length > 0 ? userCountResult[0].total : 0;

        // Count total unique dishes currently active/available from these shops
        // If they want 'all time dishes', we query the Item model
        if (city && city.trim() !== "") {
            totalDishesCount = await Shop.aggregate([
                { $match: shopMatchStage },
                { $unwind: "$items" },
                { $group: { _id: "$items" } },
                { $count: "total" }
            ]);
            totalDishesCount = totalDishesCount.length > 0 ? totalDishesCount[0].total : 0;
        } else {
            totalDishesCount = await Shop.aggregate([
                { $unwind: "$items" },
                { $group: { _id: "$items" } },
                { $count: "total" }
            ]);
            totalDishesCount = totalDishesCount.length > 0 ? totalDishesCount[0].total : 0;
        }


        // 2. Fetch Shop Revenue Data
        let shopPipeline = [
            { $match: orderMatchStage },
            { $unwind: "$shopOrders" }
        ];

        // Filter shopOrders by available shops if city is restricted
        if (city && city.trim() !== "") {
            shopPipeline.push({ $match: { "shopOrders.shop": { $in: validShopIds } } });
        }

        shopPipeline.push(
            {
                $group: {
                    _id: "$shopOrders.shop",
                    totalRevenue: { $sum: { $cond: [{ $eq: ["$shopOrders.status", "delivered"] }, "$shopOrders.subtotal", 0] } },
                    totalOrders: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "shops",
                    localField: "_id",
                    foreignField: "_id",
                    as: "shopDetails"
                }
            },
            {
                $unwind: "$shopDetails"
            },
            {
                $project: {
                    _id: 1,
                    shopName: { $ifNull: ["$shopDetails.name", "Unknown Shop"] },
                    shopEmail: { $ifNull: ["$shopDetails.email", "N/A"] },
                    totalRevenue: 1,
                    totalOrders: 1
                }
            },
            { $sort: { totalRevenue: -1 } }
        );
        const finalShops = await Order.aggregate(shopPipeline);


        // Fetch User Spending Data
        let userPipeline = [
            { $match: orderMatchStage },
            { $unwind: "$shopOrders" },
            { $match: { "shopOrders.status": "delivered" } } // Only delivered orders contribute to user spending
        ];

        if (city && city.trim() !== "") {
            userPipeline.push({ $match: { "shopOrders.shop": { $in: validShopIds } } });
        }

        userPipeline.push(
            {
                $group: {
                    _id: "$user",
                    totalAmountSpent: { $sum: "$shopOrders.subtotal" }, // Summing subtotal from delivered shop orders
                    totalOrdersMade: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    userName: { $ifNull: ["$userDetails.fullName", "Unknown User"] },
                    userEmail: { $ifNull: ["$userDetails.email", "N/A"] },
                    totalAmountSpent: 1,
                    totalOrdersMade: 1
                }
            },
            { $sort: { totalAmountSpent: -1 } }
        );
        const finalUsers = await Order.aggregate(userPipeline);

        // Fetch Item Popularity Data
        let itemPipeline = [
            { $match: orderMatchStage },
            { $unwind: "$shopOrders" },
            { $match: { "shopOrders.status": "delivered" } } // Only delivered orders contribute to item sales
        ];

        if (city && city.trim() !== "") {
            itemPipeline.push({ $match: { "shopOrders.shop": { $in: validShopIds } } });
        }

        itemPipeline.push(
            { $unwind: "$shopOrders.shopOrderItems" },
            {
                $group: {
                    _id: "$shopOrders.shopOrderItems.name",
                    totalQuantitySold: { $sum: "$shopOrders.shopOrderItems.quantity" },
                    totalRevenueGenerated: {
                        $sum: { $multiply: ["$shopOrders.shopOrderItems.price", "$shopOrders.shopOrderItems.quantity"] }
                    }
                }
            },
            {
                $project: {
                    itemName: "$_id",
                    totalQuantitySold: 1,
                    totalRevenueGenerated: 1,
                    _id: 0
                }
            },
            { $sort: { totalQuantitySold: -1 } }
        );
        const finalItems = await Order.aggregate(itemPipeline);

        res.status(200).json({
            success: true,
            reports: {
                metrics: {
                    totalRestaurantsCount,
                    totalUsersCount,
                    totalDishesCount
                },
                shops: finalShops,
                users: finalUsers,
                items: finalItems
            }
        });

    } catch (error) {
        console.error("Error generating detailed reports:", error);
        res.status(500).json({ success: false, message: "Error generating detailed reports" });
    }
};
