
import "dotenv/config";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is missing from .env");
}

const client = new MongoClient(uri);

const farmers = [
  { name: "Ramesh Shinde", village: "Kopargaon", sugarcaneSupplied: 120, amountPaid: 95000, pendingAmount: 25000 },
  { name: "Suresh Patil", village: "Yeola", sugarcaneSupplied: 95, amountPaid: 76000, pendingAmount: 18000 },
  { name: "Sunil Jadhav", village: "Rahata", sugarcaneSupplied: 150, amountPaid: 110000, pendingAmount: 40000 },
  { name: "Vijay More", village: "Shirdi", sugarcaneSupplied: 80, amountPaid: 64000, pendingAmount: 0 },
  { name: "Ashok Pawar", village: "Kopargaon", sugarcaneSupplied: 110, amountPaid: 88000, pendingAmount: 22000 },
  { name: "Dinesh Wagh", village: "Niphad", sugarcaneSupplied: 135, amountPaid: 105000, pendingAmount: 30000 },
  { name: "Ganesh Gaikwad", village: "Sinnar", sugarcaneSupplied: 70, amountPaid: 58000, pendingAmount: 12000 },
  { name: "Prakash Borse", village: "Rahata", sugarcaneSupplied: 160, amountPaid: 125000, pendingAmount: 45000 },
  { name: "Mahesh Shinde", village: "Yeola", sugarcaneSupplied: 100, amountPaid: 85000, pendingAmount: 15000 },
  { name: "Nitin Chavan", village: "Niphad", sugarcaneSupplied: 90, amountPaid: 70000, pendingAmount: 20000 }
];

async function main() {
  try {
    await client.connect();

    const db = client.db("sugarcane_db");
    const collection = db.collection("farmers");

    // Avoid duplicate sample records when rerunning this script.
    await collection.deleteMany({
      source: "mcp-demo-sample"
    });

    await collection.insertMany(
      farmers.map((farmer) => ({
        ...farmer,
        source: "mcp-demo-sample"
      }))
    );

    console.log("Farmer records inserted successfully!");
    console.log("Total farmers:", await collection.countDocuments());
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await client.close();
  }
}

main();
