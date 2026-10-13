
import "dotenv/config";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is missing from .env");
}

const client = new MongoClient(uri);

async function main() {
  try {
    await client.connect();

    console.log("Successfully connected to MongoDB Atlas!");

    const db = client.db("sugarcane_db");

    // Create a test document
    const result = await db.collection("test").insertOne({
      message: "MongoDB Atlas connected to TypeScript MCP project",
      createdAt: new Date()
    });

    console.log("Test document inserted:", result.insertedId);

    const documents = await db.collection("test").find({}).toArray();
    console.log("Documents:", documents);
  } catch (error) {
    console.error("Connection failed:", error);
  } finally {
    await client.close();
  }
}

main();
