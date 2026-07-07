import express from "express";
import cors from "cors";
import categoryRoutes from "./routes/category.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();

app.use(express.json());
app.use(cors());

app.get("/health", (req, res) => {
  res.status(200).json({ message: "healthy" });
});

app.use("/categories", categoryRoutes);
app.use("/expenses", expenseRoutes);
app.use(notFound); // no route matched → 404
app.use(errorHandler); // any error thrown anywhere → clean response

export default app;
