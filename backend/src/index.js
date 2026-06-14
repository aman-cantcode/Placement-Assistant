import "dotenv/config";
import connectDB from "./db/index.js";
import { app } from "./app.js"

const port = process.env.PORT || 8080;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.log("Failed to start server:", error);
    process.exit(1);
  });