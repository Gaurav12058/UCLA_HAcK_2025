require('dotenv').config();
const fs = require('fs');
const cors = require("cors");
const express = require("express");
const http = require('http');
const MQTT = require('mqtt');
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

const CLIENTID = "frontend";

const client = MQTT.connect(process.env.CONNECT_URL, {
  clientId: CLIENTID,
  clean: true,
  connectTimeout: 3000,
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASS,
  reconnectPeriod: 10000,
  debug: true,
  rejectUnauthorized: false // Add this line for testing, should be removed in production
});

// Used for debugging 

client.on("error", function (error) {
  console.error("Connection error: ", error);
});

client.on("close", function () {
  console.log("Connection closed");
});

client.on("offline", function () {
  console.log("Client went offline");
});

client.on("reconnect", function () {
  console.log("Attempting to reconnect...");
});

// MQTT Connection

client.on('connect', async () => {
  console.log("Connected");

  client.subscribe("ultrasonic", (err) => {
    if (err) {
      console.error("Subscription error for 'ultrasonic': ", err);
    } else {
      console.log("Subscribed to 'ultrasonic'");
    }
  });

  client.subscribe("temp", (err) => {
    if (err) {
      console.error("Subscription error for 'temp': ", err);
    } else {
      console.log("Subscribed to 'temp'");
    }
  });

  client.subscribe("humidity", (err) => {
    if (err) {
      console.error("Subscription error for 'temp': ", err);
    } else {
      console.log("Subscribed to 'humidity'");
    }
  });

  client.subscribe("light", (err) => {
    if (err) {
      console.error("Subscription error for 'light': ", err);
    } else {
      console.log("Subscribed to 'light'");
    }
  });
});


const corsOptions = {
  origin: '*'
};

APP.use(cors(corsOptions));
APP.use(express.json());

// Readings from sensors 
let latestTemp = null;
let latestUltrasonic = null;
let latestHumidity = null;
let latestLight = null;

io.on("connection", (socket) => {
  console.log("Frontend connected to socket");

  // Send the latest sensor data to the newly connected client
  if (latestTemp) {
    socket.emit('temp', latestTemp);
  }
  if (latestUltrasonic) socket.emit('ultrasonic', latestUltrasonic);
  if (latestLight) {
    socket.emit('light', latestLight);
  }

  // Listen for messages from the frontend
  socket.on('display', (message) => {
    console.log('Received message from frontend:', message);
    client.publish("display", message.toString());
  });

  // Handle take picture request
  socket.on('take_picture', () => {
    console.log('📸 Taking picture and getting AI description...');
    
    // Execute the Python script
    const pythonProcess = spawn('python3', ['../AI/receive.py'], {
      cwd: __dirname
    });

    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python output: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      console.log(`Python script finished with code ${code}`);
      if (code === 0) {
        socket.emit('picture_taken', { success: true, message: 'Picture analyzed successfully!' });
      } else {
        socket.emit('picture_taken', { success: false, message: 'Failed to analyze picture' });
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("Frontend disconnected from socket");
  });

});

setInterval(() => {
  io.emit('temp', latestTemp);
  io.emit('ultrasonic', latestUltrasonic);
  io.emit('humidity', latestHumidity);
  io.emit('light', latestLight)
}, 1000);

server.listen(8000, () => {
  console.log('Server is running on port 8000');
});

client.on('message', (TOPIC, payload) => {
  console.log("Received from broker:", TOPIC, payload.toString());
  if( TOPIC === 'temp' ) {
    latestTemp = payload.toString();
  }
  else if ( TOPIC === 'ultrasonic' ) {
    latestUltrasonic = payload.toString();
  }
  else if ( TOPIC === 'humidity') {
    latestHumidity = payload.toString();
  }
  else if ( TOPIC === 'light') {
    latestLight = payload.toString();
  }
});

