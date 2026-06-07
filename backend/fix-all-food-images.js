import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(process.env.MONGODB_URL).then(async () => {
    try {
        console.log("Connected. Running updateMany...");
        const Item = mongoose.model('Item', new mongoose.Schema({}, { strict: false }), 'items');

        const correctImages = {
            "Cheese Pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800",
            "cheese burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
            "veg grilled sandwich": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=800",
            "banana icecream": "https://images.unsplash.com/photo-1563805042-7684c8a9e9cb?auto=format&fit=crop&q=80&w=800",
            "Paneer Butter Masala": "https://upload.wikimedia.org/wikipedia/commons/3/36/Paneer_Butter_Masala_or_Paneer_Makhani.jpg",
            "Dal Makhani": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Dal_Makhani_%281%29.jpg/640px-Dal_Makhani_%281%29.jpg",
            "Veg Kadai": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Mix_veg_curry.jpg/640px-Mix_veg_curry.jpg",
            "Masala Dosa": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Dosa_at_a_street_food_stall.jpg/640px-Dosa_at_a_street_food_stall.jpg",
            "Idli Sambar": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Idli_Sambar_01.jpg/640px-Idli_Sambar_01.jpg",
            "Veg Manchurian": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Veg_Manchurian.jpg/640px-Veg_Manchurian.jpg",
            "Hakka Noodles": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Mama_Mia_Hakka_Noodles.jpg/640px-Mama_Mia_Hakka_Noodles.jpg",
            "Gulab Jamun (2 pcs)": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Gulab_jamun_%28Dessert%29.jpg/640px-Gulab_jamun_%28Dessert%29.jpg",
            "Mango Lassi": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Mango_Lassi.jpg/640px-Mango_Lassi.jpg"
        };

        let count = 0;
        for (const [name, image] of Object.entries(correctImages)) {
            const res = await Item.updateMany(
                { name: { $regex: new RegExp(`^${name}$`, 'i') } },
                { $set: { image: image } }
            );
            count += res.modifiedCount;
            console.log(`Updated ${res.modifiedCount} items for ${name}`);
        }
        console.log(`Successfully updated ${count} images in total.`);
    } catch (err) {
        console.error("Error during update:", err);
    } finally {
        process.exit(0);
    }
});
