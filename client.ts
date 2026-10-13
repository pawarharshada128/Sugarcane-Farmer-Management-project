
import "dotenv/config";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import OpenAI from "openai";

// Check the OpenAI API key
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is missing from the .env file.");
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey
});

// Question for the AI
const question =
  "Which farmers have pending payments? Show their names, villages, " +
  "pending amounts, and the total pending payment.";

// Create MCP client
const client = new Client({
  name: "sanjivani-farmer-client",
  version: "1.0.0"
});

// Start the MCP server as a child process
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [
    "node_modules/tsx/dist/cli.mjs",
    "server.ts"
  ]
});

try {
  // Connect to the MCP server
  await client.connect(transport);
  console.log("Connected to MCP server.");

  // List the available MCP tools
  const { tools } = await client.listTools();

  console.log(
    "Available tools:",
    tools.map((tool) => tool.name)
  );

  // Call the farmer-data tool
  const result = await client.callTool({
    name: "get_farmer_data",
    arguments: {}
  });

  if (result.isError) {
    throw new Error("Failed to retrieve farmer data from MongoDB.");
  }

  // Extract text returned by the MCP tool
  const farmerData = result.content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");

  console.log("Farmer data retrieved successfully.");

  // Send the data and question to OpenAI
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",

    instructions:
      "You are a sugar factory farmer-data assistant. " +
      "Answer using only the supplied farmer records. " +
      "Calculate totals carefully. Currency is INR. " +
      "Sugarcane quantities are in metric tonnes. " +
      "Do not invent farmer information.",

    input:
      `Farmer data:\n${farmerData}\n\n` +
      `Question: ${question}`
  });

  // Display the answer
  console.log("\nQuestion:");
  console.log(question);

  console.log("\nAI Answer:");
  console.log(response.output_text);

} catch (error) {
  console.error("\nApplication error:", error);
} finally {
  await client.close();
}

