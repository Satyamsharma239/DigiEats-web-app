import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import Order from "./models/order.model.js";

const run = async () => {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to DB, performing migration...");

    const orders = await Order.find({ "shopOrders.status": "delivered" });
    let fixed = 0;

    for (const order of orders) {
        let modified = false;
        for (const so of order.shopOrders) {
            if (so.status === "delivered" && !so.deliveredAt) {
                // Approximate delivery time as updated time or created time
                so.deliveredAt = order.updatedAt || order.createdAt || new Date();
                modified = true;
                fixed++;
            }
        }
        if (modified) {
            await order.save();
        }
    }

    console.log(`Migration Complete. Fixed ${fixed} legacy orders with missing deliveredAt timestamps.`);
    process.exit(0);
};

run().catch(console.error);
