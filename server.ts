import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import cors from "cors";
import { createServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
// Resolve the absolute path of this module file and its directory
const moduleFilePath = fileURLToPath(import.meta.url);
const moduleDirPath = path.dirname(moduleFilePath);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "DELETE", "PUT"],
  },
});



app.use(cors());
app.use(express.json());

// Important folders used by the server
const buildOutputDir = path.resolve(moduleDirPath, "dist");
const staticPublicDir = path.resolve(moduleDirPath, "public");

// Demo in-memory posts store for local testing
type LocalPost = { id: number; title: string; body?: string; createdAt: string };
let nextPostId = 1;
const posts: LocalPost[] = [];

app.get("/api/posts", (req, res) => {
  res.json(posts);
});

app.post("/api/posts", (req, res) => {
  const { title, body } = req.body ?? {};
  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "title is required" });
  }
  const post: LocalPost = {
    id: nextPostId++,
    title,
    body: typeof body === "string" ? body : undefined,
    createdAt: new Date().toISOString(),
  };
  posts.unshift(post);
  // Broadcast to all clients
  io.emit("post:created", post);
  return res.status(201).json(post);
});

app.delete("/api/posts/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  posts.splice(idx, 1);
  // Notify clients
  io.emit("post:deleted", { id });
  return res.status(204).send();
});

// Logging a hint if dist is missing
if (!fs.existsSync(path.join(buildOutputDir, "index.html"))) {
  console.warn(
    "[server] dist/index.html not found. Run 'npm run build' first to generate the production build."
  );
}

// Serve static assets from dist (preferred) and public as fallback
if (fs.existsSync(buildOutputDir)) {
  app.use(express.static(buildOutputDir, { maxAge: "1y", index: false }));
}
if (fs.existsSync(staticPublicDir)) {
  app.use(express.static(staticPublicDir, { maxAge: "1d", index: false }));
}

// SPA fallback to dist/index.html (terminal middleware)
app.use((req, res) => {
  const indexHtmlPath = path.join(buildOutputDir, "index.html");
  if (fs.existsSync(indexHtmlPath)) {
    res.sendFile(indexHtmlPath);
  } else {
    res
      .status(500)
      .send(
        "Build output not found. Please run 'npm run build' and then restart the server."
      );
  }
});

io.on("connection", (socket) => {
  console.log("[socket.io] client connected:", socket.id);
  // Re-broadcast client-originated signals to all others
  socket.on("post:created", (payload) => {
    socket.broadcast.emit("post:created", payload);
  });
  socket.on("post:deleted", (payload) => {
    socket.broadcast.emit("post:deleted", payload);
  });
  socket.on("disconnect", () => {
    console.log("[socket.io] client disconnected:", socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[server] Listening on http://localhost:${PORT}`);
});
