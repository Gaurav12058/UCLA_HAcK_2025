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
  const [lightLevel, setLightLevel] = useState("-");
  const [oledText, setOledText] = useState("");

  // WebSocket: picture status
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

  const handleTakePhoto = async () => {
    try {
      const res = await fetch("/api/take-photo");
      if (!res.ok) throw new Error("Failed to take photo");
      alert("Photo taken!");
    } catch (err) {
      console.error(err);
      alert("Error taking photo");
    }
  };

  // MQTT: sensor data
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
      client.subscribe("pico/lightlevel");
    });

    client.on("message", (topic, message) => {
      const value = message.toString();
      if (topic === "pico/temperature") setTemperature(value);
      else if (topic === "pico/humidity") setHumidity(value);
      else if (topic === "pico/distance") setDistance(value);
      else if (topic === "pico/lightlevel") setLightLevel(value);
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
      <h1>ESP32 Camera Interface</h1>

      <div>
        <h2>Live Feed</h2>
        <img src="http://192.168.50.26:COM7/stream" alt="Live Camera Feed" />
      </div>

      <div>
        <h2>Most Recent Photo</h2>
        <img src={`/downloaded_image.jpg?t=${Date.now()}`} alt="Most Recent Photo" />
      </div>

      <div>
        <button onClick={handleTakePhoto}>Take Photo</button>
      </div>


      <h2>📊 Sensor Dashboard</h2>
      <div className="sensor-box">
        <p><strong>Temperature:</strong> {temperature} °C</p>
        <p><strong>Humidity:</strong> {humidity} %</p>
        <p><strong>Distance:</strong> {distance} cm</p>
        <p><strong>Light:</strong> {lightLevel} %</p>
      </div>
    </div>
  );
}

export default App;
