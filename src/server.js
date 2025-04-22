// server.js
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors({ origin: "http://127.0.0.1:8000" }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://127.0.0.1:8000",
    methods: ["GET", "POST"],
  },
});

// MySQL connection (optional for now)
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "leaderboard",
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection error:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

// Handle socket connections
io.on("connection", (socket) => {
  console.log("Socket.IO client connected");

  socket.on("recalculate", () => {
    const query = `
      SELECT users.id, users.name, SUM(activities.points) as total_points
      FROM users
      LEFT JOIN activities ON users.id = activities.user_id
      GROUP BY users.id
      ORDER BY total_points DESC
    `;

    db.query(query, (err, results) => {
      if (!err) {
        console.log("Leaderboard recalculated:", results);
        io.emit("updateLeaderboard", results);
      }else {
        console.error("Error fetching leaderboard data:", err);
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("Socket.IO client disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on http://localhost:${PORT}`);
});
