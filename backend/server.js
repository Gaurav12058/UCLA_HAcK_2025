require('dotenv').config();
const fs = require('fs');
const cors = require("cors");
const express = require("express");
const http = require('http');
const mqtt = require('mqtt');
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

const CLIENTID = `frontend_${Math.random().toString(16).slice(3)}`;

// Declare sensor variables
let latestTemp = null;
let latestUltrasonic = null;
let latestHumidity = null;
let latestLight = null;

// MQTT config
const client = mqtt.connect(process.env.CONNECT_URL, {
  clientId: CLIENTID,
  username: process.env.MQTT_USER,
  password:  process.env.MQTT_PASS,
  clean: true,
  connectTimeout: 10000,
  reconnectPeriod: 1000,
});

APP.use(cors());
APP.use(express.json());

// MQTT Event handlers
client.on("connect", () => {
  console.log("MQTT Connected");

  ["ultrasonic", "temp", "humidity", "light"].forEach((topic) => {
    client.subscribe(topic, (err) => {
      if (err) console.error(`Subscription error for '${topic}': `, err);
      else console.log(`Subscribed to '${topic}'`);
    });
  });
});

client.on("message", (topic, payload) => {
  const msg = payload.toString();
  if (topic === "temp") latestTemp = msg;
  else if (topic === "ultrasonic") latestUltrasonic = msg;
  else if (topic === "humidity") latestHumidity = msg;
  else if (topic === "light") latestLight = msg;
});

client.on("error", err => console.error("MQTT Error:", err));
client.on("close", () => console.log("MQTT Closed"));
client.on("offline", () => console.log("MQTT Offline"));
client.on("reconnect", () => console.log("MQTT Reconnecting"));

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Frontend connected");

  // Emit current sensor data on connection
  if (latestTemp) socket.emit('temp', latestTemp);
  if (latestUltrasonic) socket.emit('ultrasonic', latestUltrasonic);
  if (latestHumidity) socket.emit('humidity', latestHumidity);
  if (latestLight) socket.emit('light', latestLight);

  socket.on('display', (msg) => {
    console.log('Display msg:', msg);
    client.publish("pico/oled", msg.toString(), (err) => {
      if (err) console.error('MQTT publish error:', err);
    });
  });

  // Trigger python script that takes photo (no AI call here)
  socket.on('take_picture', () => {
    console.log('📸 Taking picture...');
    const pythonProcess = spawn('python', ['../AI/receive.py'], { cwd: __dirname });

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
        message: success ? 'Picture taken!' : 'Error taking picture.'
      });
    });
  });

  socket.on("disconnect", () => {
    console.log("Frontend disconnected");
  });
});

// Emit updated sensor data every second
setInterval(() => {
  io.emit('temp', latestTemp);
  io.emit('ultrasonic', latestUltrasonic);
  io.emit('humidity', latestHumidity);
  io.emit('light', latestLight);
}, 1000);

// REST API: take photo only
APP.get("/api/take-photo", (req, res) => {
  const script = path.join(__dirname, "..", "AI", "receive.py");
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

// REST API: analyze photo separately with OpenAI
APP.post("/api/analyze-photo", (req, res) => {
  const prompt = req.body.prompt || "Describe this image";

  const script = path.join(__dirname, "..", "AI", "send_to_openai.py");
  const cmd = `python "${script}" "${prompt}"`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error("Error running send_to_openai.py:", stderr);
      return res.status(500).json({ success: false, error: stderr });
    }
    console.log("send_to_openai.py output:", stdout);
    res.json({ success: true, output: stdout });
  });
});

// REST API: update OLED text
APP.post("/api/update-text", (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ success: false, error: "Invalid text input" });
  }

  console.log("Sending text to OLED:", text);
  client.publish("pico/oled", text, (err) => {
    if (err) {
      console.error("Failed to publish to MQTT topic:", err);
      return res.status(500).json({ success: false, error: "MQTT publish failed" });
    }

    res.json({ success: true, message: "Text sent to OLED" });
  });
});

// Start server
server.listen(8000, () => {
  console.log('Server is running on port 8000');
});
