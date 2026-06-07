import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import Order from "./models/order.model.js";
import User from "./models/user.model.js";

const run = async () => {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to DB");

    // Find delivery boys
    const boys = await User.find({ role: "deliveryBoy" });
    console.log(`Found ${boys.length} delivery boys.`);

    for (const boy of boys) {
        console.log(`\nDelivery Boy: ${boy.fullName} (${boy._id})`);

        // Find all orders assigned to this boy
        const orders = await Order.find({ "shopOrders.assignedDeliveryBoy": boy._id });
        console.log(`Assigned orders found in DB: ${orders.length}`);

        const delivered = orders.filter(o => o.shopOrders.some(so => String(so.assignedDeliveryBoy) === String(boy._id) && so.status === "delivered"));
        console.log(`Delivered orders found in DB: ${delivered.length}`);

        if (delivered.length > 0) {
            delivered.forEach(o => {
                const so = o.shopOrders.find(s => String(s.assignedDeliveryBoy) === String(boy._id));
                console.log(`- Order: DB_ID=${o._id}, DeliveredAt=${so.deliveredAt}, Status=${so.status}`);
            });
        }
    }

    process.exit(0);
};

run().catch(console.error);
