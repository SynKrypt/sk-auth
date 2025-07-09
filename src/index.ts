import express from "express";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { v4 as uuid } from "uuid";

const prisma = new PrismaClient();

const app = express();

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
  main();
});

async function main() {
  console.log("Connected to database");
  try {
    const newOrganization = await prisma.Organization.create({
      data: {
        id: uuid(),
        name: "Test Organization",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log(newOrganization);
  } catch (error) {
    console.log(error);
  }
}
