import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Admin from "./models/admin.model.js";

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB...");

        const email = "satyu235@gmail.com";
        const password = "adminpassword123";

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            console.log("Admin account already exists. Email:", email);
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = new Admin({
            email,
            password: hashedPassword,
            role: "superadmin"
        });

        await newAdmin.save();
        console.log("===================================");
        console.log("SUPER ADMIN ACCOUNT CREATED!");
        console.log("Email:", email);
        console.log("Password:", password);
        console.log("⚠️ Please change your password later or delete this script.");
        console.log("===================================");

    } catch (error) {
        console.error("Error creating admin:", error);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
};

createAdmin();
