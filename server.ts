
import "dotenv/config";
import { MongoClient } from "mongodb";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is missing from .env");
}

const mongo = new MongoClient(mongoUri);
await mongo.connect();

console.error("Connected to MongoDB Atlas.");

const db = mongo.db("sugarcane_db");
const farmers = db.collection("farmers");

const server = new McpServer({
  name: "sanjivani-farmer-server",
  version: "1.0.0"
});

server.registerTool(
  "get_farmer_data",
  {
    description:
      "Retrieve all farmer records from MongoDB Atlas, including farmer name, village, sugarcane supplied, amount paid, and pending payment.",
    inputSchema: {}
  },
  async () => {
    try {
      const records = await farmers
        .find({}, { projection: { _id: 0 } })
        .toArray();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(records)
          }
        ]
      };
    } catch (error) {
      console.error("Failed to retrieve farmer records:", error);

      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "Could not retrieve farmer records from MongoDB Atlas."
          }
        ]
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);

console.error("MCP farmer server is running.");

async function shutdown() {
  await server.close();
  await mongo.close();
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
