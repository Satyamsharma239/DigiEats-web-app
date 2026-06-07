import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

mongoose.connect(process.env.MONGODB_URL).then(async () => {
    try {
        await mongoose.connection.db.collection('users').dropIndex('email_1');
        console.log('Successfully dropped email_1 index');
    } catch (e) {
        console.log('Error dropping index:', e.message);
    }

    // Now trigger a re-sync of indexes from the models so that the sparse:true index is created
    import('./models/user.model.js').then(async (module) => {
        const User = module.default;
        await User.syncIndexes();
        console.log('Successfully recreated unique sparse index for email');
        process.exit(0);
    });
}).catch(e => {
    console.log('Connection error:', e);
    process.exit(1);
});
