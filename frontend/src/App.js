// src/App.js

import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import mqtt from "mqtt";
import "./App.css";

// Connect to WebSocket server
const socket = io("http://localhost:8000");

function App() {
  const [pictureStatus, setPictureStatus] = useState("");
  const [temperature, setTemperature] = useState("-");
  const [humidity, setHumidity] = useState("-");
  const [distance, setDistance] = useState("-");

  // Handle WebSocket for picture capture
  useEffect(() => {
    socket.on("connect", () => console.log("Connected to WebSocket:", socket.id));

    socket.on("picture_taken", (data) => {
      setPictureStatus(data.message);
      setTimeout(() => setPictureStatus(""), 3000);
    });

    return () => {
      socket.off("picture_taken");
    };
  }, []);

  // Handle MQTT for sensor data
  useEffect(() => {
    const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;

    const options = {
      clientId,
      username: "Nathan",
      password: "Ab123456",
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    };

    const host = "wss://cd2116d580294ecb806ddd465da330cd.s1.eu.hivemq.cloud:8884/mqtt";  
    const client = mqtt.connect(host, options);

    client.on("connect", () => {
      console.log("Connected to HiveMQ MQTT broker");
      client.subscribe("pico/temperature");
      client.subscribe("pico/humidity");
      client.subscribe("pico/distance");
    });

    client.on("message", (topic, message) => {
      const value = message.toString();
      if (topic === "pico/temperature") setTemperature(value);
      if (topic === "pico/humidity") setHumidity(value);
      if (topic === "pico/distance") setDistance(value);
    });

    client.on("error", (err) => {
      console.error("MQTT error:", err);
      client.end();
    });

    return () => {
      client.end();
    };
  }, []);

  return (
    <div className="app">
      <h1>📷 Picture Capture Status</h1>
      {pictureStatus && <div className="status-box">{pictureStatus}</div>}

      <h2>📊 Sensor Dashboard</h2>
      <div className="sensor-box">
        <p><strong>Temperature:</strong> {temperature} °C</p>
        <p><strong>Humidity:</strong> {humidity} %</p>
        <p><strong>Distance:</strong> {distance} cm</p>
      </div>
    </div>
  );
}

export default App;
