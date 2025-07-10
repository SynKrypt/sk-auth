import express from "express";
import "dotenv/config";
import DBModule from "./modules/db/db.module.ts";

const app = express();

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
  main();
});

async function main() {
  const db = new DBModule();
  console.log("Connected to database");
  try {
    const projectName = "Test project-3";
    const orgId = "8e355a9f-85ac-4ef8-a685-fa37b203aa27";
    const response = await db.createNewProject(orgId, projectName);
    console.log(response);
  } catch (error: any) {
    console.log(error);
  }
}
