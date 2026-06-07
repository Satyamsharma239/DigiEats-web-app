import mongoose from "mongoose";
import dotenv from "dotenv";
import Item from "./models/item.model.js";

dotenv.config();

mongoose.connect(process.env.MONGODB_URL).then(() => {
    console.log("Connected to MongoDB to fix food images...");
}).catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
});

async function fixDishImages() {
    try {
        const correctImages = [
            {
                name: "Paneer Butter Masala",
                image: "https://upload.wikimedia.org/wikipedia/commons/3/36/Paneer_Butter_Masala_or_Paneer_Makhani.jpg"
            },
            {
                name: "Dal Makhani",
                image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Dal_Makhani_%281%29.jpg/640px-Dal_Makhani_%281%29.jpg"
            },
            {
                name: "Veg Kadai",
                image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Mix_veg_curry.jpg/640px-Mix_veg_curry.jpg"
            },
            {
                name: "Masala Dosa",
                image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Dosa_at_a_street_food_stall.jpg/640px-Dosa_at_a_street_food_stall.jpg"
            },
            {
                name: "Idli Sambar",
                image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Idli_Sambar_01.jpg/640px-Idli_Sambar_01.jpg"
            },
            {
                name: "Veg Manchurian",
                image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Veg_Manchurian.jpg/640px-Veg_Manchurian.jpg"
            },
            {
                name: "Hakka Noodles",
                image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Mama_Mia_Hakka_Noodles.jpg/640px-Mama_Mia_Hakka_Noodles.jpg"
            },
            {
                name: "Gulab Jamun (2 pcs)",
                image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Gulab_jamun_%28Dessert%29.jpg/640px-Gulab_jamun_%28Dessert%29.jpg"
            },
            {
                name: "Mango Lassi",
                image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Mango_Lassi.jpg/640px-Mango_Lassi.jpg"
            }
        ];

        for (const update of correctImages) {
            const result = await Item.findOneAndUpdate(
                { name: update.name },
                { $set: { image: update.image } }
            );
            if (result) {
                console.log(`✅ Fixed image for: ${update.name}`);
            } else {
                console.log(`❌ Item not found: ${update.name}`);
            }
        }

        console.log("All food image corrections processed!");

    } catch (error) {
        console.error("Error during updating:", error);
    } finally {
        mongoose.disconnect();
    }
}

fixDishImages();
