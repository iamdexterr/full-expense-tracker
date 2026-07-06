import app from "./app.js";
import { prisma } from "./db.js";

const PORT = 8080;

app.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");
    console.log(`🚀 Server running on port ${PORT}`);
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }
});
