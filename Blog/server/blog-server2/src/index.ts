import "dotenv/config";
import cors from "cors";
import express from "express";
import { connectToDb } from "./config/db";
import userRouter from "./api/routes";

const app = express();
const port = process.env.port || 10000; app.listen(port, '0.0.0.0');


app.use((req, res, next) => {
  const startedAt = Date.now();
  console.log(`--> ${req.method} ${req.originalUrl}`);
  res.on("finish", () => {
    console.log(
      `<-- ${req.method} ${req.originalUrl} ${res.statusCode} (${Date.now() - startedAt}ms)`,
    );
  });
  next();
});

app.use(express.json());
app.use(cors());

app.get("/", (_req, res) => {
  res.send("Hello TypeScript + Express!");
});

app.use("/", userRouter);

app.use((_req, res) => {
  res.status(404).send("Page not found");
});

void connectToDb().then(() => {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});
