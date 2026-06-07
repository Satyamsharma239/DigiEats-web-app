import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import Item from "./models/item.model.js";

dotenv.config();

const images = [
    { name: "Paneer Butter Masala", src: "C:\\Users\\rajivi\\.gemini\\antigravity\\brain\\0497e524-91e7-4bad-a1d1-05566555d7cf\\paneer_butter_masala_1772204066132.png", destName: "paneer_butter_masala.png" },
    { name: "Dal Makhani", src: "C:\\Users\\rajivi\\.gemini\\antigravity\\brain\\0497e524-91e7-4bad-a1d1-05566555d7cf\\dal_makhani_1772204133864.png", destName: "dal_makhani.png" },
    { name: "Veg Kadai", src: "C:\\Users\\rajivi\\.gemini\\antigravity\\brain\\0497e524-91e7-4bad-a1d1-05566555d7cf\\veg_kadai_1772204191442.png", destName: "veg_kadai.png" },
    { name: "Masala Dosa", src: "C:\\Users\\rajivi\\.gemini\\antigravity\\brain\\0497e524-91e7-4bad-a1d1-05566555d7cf\\masala_dosa_1772204218283.png", destName: "masala_dosa.png" },
    { name: "Idli Sambar", src: "C:\\Users\\rajivi\\.gemini\\antigravity\\brain\\0497e524-91e7-4bad-a1d1-05566555d7cf\\idli_sambar_1772204300097.png", destName: "idli_sambar.png" },
    { name: "Veg Manchurian", src: "C:\\Users\\rajivi\\.gemini\\antigravity\\brain\\0497e524-91e7-4bad-a1d1-05566555d7cf\\veg_manchurian_1772204404769.png", destName: "veg_manchurian.png" },
    { name: "Hakka Noodles", src: "C:\\Users\\rajivi\\.gemini\\antigravity\\brain\\0497e524-91e7-4bad-a1d1-05566555d7cf\\hakka_noodles_1772204457256.png", destName: "hakka_noodles.png" },
    { name: "Gulab Jamun (2 pcs)", src: "C:\\Users\\rajivi\\.gemini\\antigravity\\brain\\0497e524-91e7-4bad-a1d1-05566555d7cf\\gulab_jamun_1772204522814.png", destName: "gulab_jamun.png" },
    { name: "Mango Lassi", src: "C:\\Users\\rajivi\\.gemini\\antigravity\\brain\\0497e524-91e7-4bad-a1d1-05566555d7cf\\mango_lassi_1772204565356.png", destName: "mango_lassi.png" }
];

const destDir = "C:\\Users\\rajivi\\Downloads\\DigiEats\\8.vingo\\frontend\\public\\food";

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

mongoose.connect(process.env.MONGODB_URL).then(async () => {
    console.log("Connected to MongoDB...");
    try {
        for (const img of images) {
            const destPath = path.join(destDir, img.destName);
            if (fs.existsSync(img.src)) {
                fs.copyFileSync(img.src, destPath);
                console.log(`Copied ${img.destName}`);
            } else {
                console.error(`Missing source: ${img.src}`);
            }

            const publicUrl = `/food/${img.destName}`;

            const result = await Item.updateMany(
                { name: { $regex: new RegExp(`^${img.name}$`, 'i') } },
                { $set: { image: publicUrl } }
            );
            console.log(`Updated ${result.modifiedCount} items for ${img.name} to ${publicUrl}`);
        }
        console.log("Done!");
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
});
