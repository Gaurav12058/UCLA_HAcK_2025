require('dotenv').config();
const fs = require('fs');
const cors = require("cors");
const express = require("express");
const http = require('http');
const MQTT = require('mqtt');
const { spawn, exec } = require('child_process');
const path = require("path");

const APP = express();
const server = http.createServer(APP);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// MQTT config
const CLIENTID = "frontend";
const client = MQTT.connect(process.env.CONNECT_URL, {
  clientId: CLIENTID,
  clean: true,
  connectTimeout: 4000,
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASS,
  reconnectPeriod: 10000,
  rejectUnauthorized: false // remove if cert is valid/trusted
});

APP.use(cors());
APP.use(express.json());

// Sensor data storage
let latestTemp = null;
let latestUltrasonic = null;
let latestHumidity = null;
let latestLight = null;

// --- MQTT Events ---
client.on("connect", () => {
  console.log("MQTT Connected");

  ["ultrasonic", "temp", "humidity", "light"].forEach((topic) => {
    client.subscribe(topic, (err) => {
      if (err) console.error(`Subscription error for '${topic}': `, err);
      else console.log(`Subscribed to '${topic}'`);
    });
  });
});

client.on("message", (TOPIC, payload) => {
  const msg = payload.toString();
  if (TOPIC === "temp") latestTemp = msg;
  else if (TOPIC === "ultrasonic") latestUltrasonic = msg;
  else if (TOPIC === "humidity") latestHumidity = msg;
  else if (TOPIC === "light") latestLight = msg;
});

client.on("error", err => console.error("MQTT Error:", err));
client.on("close", () => console.log("MQTT Closed"));
client.on("offline", () => console.log("MQTT Offline"));
client.on("reconnect", () => console.log("MQTT Reconnecting"));

// --- WebSocket (Socket.IO) ---
io.on("connection", (socket) => {
  console.log("Frontend connected");

  if (latestTemp) socket.emit('temp', latestTemp);
  if (latestUltrasonic) socket.emit('ultrasonic', latestUltrasonic);
  if (latestLight) socket.emit('light', latestLight);

  socket.on('display', (msg) => {
    console.log('Display msg:', msg);
    client.publish("display", msg.toString());
  });

  socket.on('take_picture', () => {
    console.log('📸 Taking picture...');
    const pythonProcess = spawn('python', ['../AI/receive.py'], {
      cwd: __dirname
    });

    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python output: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      const success = code === 0;
      socket.emit('picture_taken', {
        success,
        message: success ? 'Picture analyzed!' : 'Error analyzing picture.'
      });
    });
  });

  socket.on("disconnect", () => {
    console.log("Frontend disconnected");
  });
});

// Emit sensor data every second
setInterval(() => {
  io.emit('temp', latestTemp);
  io.emit('ultrasonic', latestUltrasonic);
  io.emit('humidity', latestHumidity);
  io.emit('light', latestLight);
}, 1000);

// --- New route: HTTP GET /api/take-photo ---
APP.get("/api/take-photo", (req, res) => {
  const script = "C:\\Users\\Capta\\Documents\\VScode\\UCLA_HAcK_2025\\AI\\receive.py";
  const cmd = `python "${script}"`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error("Error running receive.py:", stderr);
      return res.status(500).json({ success: false, error: stderr });
    }
    console.log("receive.py output:", stdout);
    res.json({ success: true, output: stdout });
  });
});

// Start server
server.listen(8000, () => {
  console.log('🌐 Server is running on port 8000');
});
