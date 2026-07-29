import dotenv from "dotenv";
import path from "path";

export function loadEnvironment(currentDir) {
  dotenv.config();
  dotenv.config({ path: path.join(currentDir, "../.env") });
}
