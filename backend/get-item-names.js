import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

mongoose.connect(process.env.MONGODB_URL).then(async () => {
    const Item = mongoose.model('Item', new mongoose.Schema({}, { strict: false }), 'items');
    const items = await Item.find({});
    const uniqueItems = {};
    items.forEach(i => {
        if (!uniqueItems[i.name]) uniqueItems[i.name] = i.image;
    });
    fs.writeFileSync('item-names.json', JSON.stringify(uniqueItems, null, 2));
    console.log("Dumped to item-names.json");
    process.exit(0);
});
