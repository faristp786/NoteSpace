import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected successfully!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Port: ${conn.connection.port}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`🧭 View in MongoDB Compass: connect to ${process.env.MONGO_URI.split("/")[2] || "mongodb://127.0.0.1:27017"}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};
