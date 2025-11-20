import "./loadEnv.js";

import app from "./app.js";
import { connectDB } from "./config/db.js";

connectDB();

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(` Server running on PORT: ${PORT}`);
});