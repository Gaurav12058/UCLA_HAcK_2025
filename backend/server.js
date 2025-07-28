require('dotenv').config();
const fs = require('fs');
const cors = require("cors");
const express = require("express");
const http = require('http');
const mqtt = require('mqtt');
const { spawn } = require('child_process');

const APP = express();
const server = http.createServer(APP);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const CLIENTID = `backend`;

// Declare sensor variables
let latestTemp = null;
let latestUltrasonic = null;
let latestHumidity = null;
let latestLight = null;

// MQTT config
const client = mqtt.connect("wss://cd2116d580294ecb806ddd465da330cd.s1.eu.hivemq.cloud:8884/mqtt", {
  clientId: CLIENTID,
  username: "Nathan",
  password:  "Ab123456",
  clean: true,
  connectTimeout: 10000,
  reconnectPeriod: 1000,
});

APP.use(cors());
APP.use(express.json());

// MQTT Event handlers
client.on("connect", () => {
  console.log("MQTT Connected");

  ["pico/temperature", "pico/humidity", "pico/distance", "pico/lightlevel"].forEach((topic) => {
    client.subscribe(topic, (err) => {
      if (err) console.error(`Subscription error for '${topic}': `, err);
      else console.log(`Subscribed to '${topic}'`);
    });
  });
});

client.on("message", (topic, payload) => {
  const msg = payload.toString();
  if (topic === "pico/temperature") latestTemp = msg;
  else if (topic === "pico/humidity") latestHumidity = msg;
  else if (topic === "pico/distance") latestUltrasonic = msg;
  else if (topic === "pico/lightlevel") latestLight = msg;
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

  // Trigger python script that takes photo (no AI call here)
  socket.on('take_picture', () => {
    console.log('Taking picture...');
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

  // Trigger python script that analyzes photo and creates an audio output.
  socket.on("analyze_image", ({ prompt }) => {
    console.log("Received analyze_image with prompt:", prompt);
    
    const python = spawn("python", ["../AI/send_to_openai.py", prompt]);

    python.on("error", (err) => {
      console.error("Failed to start Python script:", err);
      socket.emit("analysis_error", { error: "Failed to launch analysis." });
    });

    python.stdout.on("data", (data) => {
      console.log("Python output:", data.toString());
    });

    python.stderr.on("data", (data) => {
      console.error("Python error output:", data.toString());
    });

    python.on("close", (code) => {
      if (code === 0) {
        console.log("Image analysis complete.");
        socket.emit("analysis_complete", {
          audioPath: `/audio/output.wav?t=${Date.now()}`
        });
      } else {
        console.error("Python script exited with code", code);
        socket.emit("analysis_error", {
          error: "Image analysis failed. Exit code: " + code
        });
      }
    });
  });

  // send message to OLED
  socket.on("send_to_oled", ({ text }) => {
    if (!text || typeof text !== "string") {
      socket.emit("oled_error", "Invalid text input");
      return;
    }

    console.log("Sending to OLED via MQTT:", text);
    client.publish("pico/oled", text, (err) => {
      if (err) {
        console.error("MQTT publish error:", err);
        socket.emit("oled_error", "Failed to publish to MQTT");
      } else {
        socket.emit("oled_ack", "Text sent to OLED!");
      }
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

// Start server
server.listen(8000, () => {
  console.log('Server is running on port 8000');
});
