const express = require("express");
const cors = require("cors");
const app = express();
const port = 3002;
const portID = "http://localhost:3002";

app.use(cors());
app.use(express.json());

export async function gamesView() {
  try {
    // Update the fetch URL
    const response = await fetch(`${portID}/api/games`);
    // ... rest of the function
  } catch (error) {
    // ... error handling
  }
} 

// Sample data (array is easier to work with for lookups)
const products = [
  { id: 23, name: "Laptop", price: 999 },
  { id: 24, name: "Phone", price: 499 },
  { id: 25, name: "Tablet", price: 299 },
];

// Root route
app.get("/", (req, res) => {
  res.send(
    "Hello from my Express server! Try /api/products or /api/products/23"
  );
});

// List all products
app.get("/api/products", (req, res) => {
  res.json(products);
});

// Get product by id
app.get("/api/products/:id", (req, res) => {
  const productID = Number(req.params.id);
  const found = products.find((p) => p.id === productID);
  if (found) return res.json(found);
  res.status(404).send("Product not found");
});

app.listen(port, () => console.log(`http://localhost:${port}`));
