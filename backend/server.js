import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import noteRoutes from "./routes/noteRoutes.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
connectDB();

// API Routes
app.use("/api/notes", noteRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "NoteSpace backend is running and connected to MongoDB",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.send("NoteSpace Backend API is running. Check MongoDB Compass for database: notespace");
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
