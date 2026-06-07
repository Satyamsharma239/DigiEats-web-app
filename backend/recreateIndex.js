import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

mongoose.connect(process.env.MONGODB_URL).then(async () => {
    try {
        await mongoose.connection.db.collection('users').createIndex(
            { email: 1 },
            { unique: true, sparse: true }
        );
        console.log('Successfully recreated sparse index on email');
    } catch (e) {
        console.log('Error creating index:', e.message);
    }
    process.exit(0);
}).catch(e => {
    console.log('Connection error:', e);
    process.exit(1);
});
