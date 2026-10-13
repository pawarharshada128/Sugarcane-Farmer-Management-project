
import "dotenv/config";
import express from "express";
import cors from "cors";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import OpenAI from "openai";

const app = express();
const PORT = 5001;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("OPENAI_API_KEY is missing from .env");
}

const openai = new OpenAI({ apiKey });

const mcpClient = new Client({
  name: "sanjivani-react-api",
  version: "1.0.0"
});

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["node_modules/tsx/dist/cli.mjs", "server.ts"]
});

await mcpClient.connect(transport);
console.log("Connected to MCP server.");

async function getFarmers() {
  const result = await mcpClient.callTool({
    name: "get_farmer_data",
    arguments: {}
  });

  if (result.isError) {
    throw new Error("MCP farmer-data tool failed.");
  }

  const text = result.content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");

  return JSON.parse(text);
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/farmers", async (_req, res) => {
  try {
    res.json(await getFarmers());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load farmers." });
  }
});

app.post("/api/ask", async (req, res) => {
  try {
    const question = req.body?.question;

    if (typeof question !== "string" || !question.trim()) {
      res.status(400).json({ error: "Enter a question." });
      return;
    }

    const farmers = await getFarmers();

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      instructions:
        "Answer using only the supplied farmer records. " +
        "Currency is INR and sugarcane quantities are metric tonnes. " +
        "Calculate totals carefully and never invent information.",
      input:
        `Farmer records:\n${JSON.stringify(farmers)}\n\n` +
        `Question: ${question.trim()}`
    });

    res.json({ answer: response.output_text });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Could not answer the question. Check the backend terminal."
    });
  }
});

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});

async function shutdown() {
  await mcpClient.close();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
