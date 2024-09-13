import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config();

async function connectMongoDb(){
    const MONGODB_URI = process.env['MONGODB_URI'] ?? ""
    try {
        await mongoose.connect(MONGODB_URI
            // {
            //     bufferCommands: false, // Disable Mongoose buffering
            //     bufferMaxEntries: 0, // Disable Mongoose buffering
            //     useNewUrlParser: true,
            //     useUnifiedTopology: true,
            //     serverSelectionTimeoutMS: 10000, // Timeout for server selection
            //     socketTimeoutMS: 45000, // Timeout for socket connections
            // }
        );
        console.log("MongoDB connected");
    } catch (error) {
        console.log("Error in MongoDB", error);
    }
}
export default connectMongoDb;