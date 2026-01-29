import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import logger from "morgan";
import dotenv from "dotenv";
import authRouter from './routes/auth-route';
import coursesRouter from './routes/courses-route';
import materialsRouter from './routes/materials-route';
import pdfParserRouter from './routes/pdf-parser-route';
import ragRouter from './routes/rag-route';
import contentRouter from './routes/content-route';
import validationRouter from './routes/validation-route';


dotenv.config();

const app = express();

// Middleware to parse JSON request body
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(logger("dev"));
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "https://93xd6lpd-8000.asse.devtunnels.ms"],
    credentials: true,
  })
);

// Mount routers
app.use('/api/auth', authRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/pdf-parser', pdfParserRouter);
app.use('/api/rag', ragRouter);
app.use('/api/content', contentRouter);
app.use('/api/validation', validationRouter);



app.get("/", (req, res) => {
  res.send("Buet Mock server is running");
});



// error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.log("App error -> ", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

// catch all the unknown routes
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Start the server
const startServer = async () => {
  try {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`🚀 Server running on http://localhost:${process.env.PORT || 8000}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
