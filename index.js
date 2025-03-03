import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";

dotenv.config();

const app = express();

// ✅ Step 1: Middleware for JSON and URL encoding
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Step 2: Updated CORS Configuration
const allowedOrigins = [
    "http://localhost:5173",  // Vite default port
    "http://localhost:3000"   // Next.js default port
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true, // Allow cookies and authentication headers
};

app.use(cors(corsOptions));

// ✅ Step 3: Connect Routes
app.use("/api/v1/user", userRoute);

// ✅ Step 4: Start the Server
const PORT = process.env.PORT || 3000;
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
});
