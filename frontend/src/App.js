import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import mqtt from "mqtt";
import "./App.css";

function App() {
  const [pictureStatus, setPictureStatus] = useState("");
  const [temperature, setTemperature] = useState("-");
  const [humidity, setHumidity] = useState("-");
  const [distance, setDistance] = useState("-");
  const [lightLevel, setLightLevel] = useState("-");
  const [oledText, setOledText] = useState("");
  const [audioTimestamp, setAudioTimestamp] = useState(Date.now());
  const [prompt, setPrompt] = useState("")

  // MQTT for sensor data
  useEffect(() => {
    const MQTT_URL = "wss://cd2116d580294ecb806ddd465da330cd.s1.eu.hivemq.cloud:8884/mqtt";
    const options = {
      username: "Nathan",
      password: "Ab123456",
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 10 * 1000,
    };

    const client = mqtt.connect(MQTT_URL, options);

    client.on("connect", () => {
      console.log("MQTT connected");
      client.subscribe(
        ["pico/temperature", "pico/humidity", "pico/distance", "pico/lightlevel"],
        (err) => {
          if (err) console.error("Subscribe error:", err);
        }
      );
    });

    client.on("message", (topic, message) => {
      const value = message.toString();
      switch (topic) {
        case "pico/temperature":
          setTemperature(value);
          break;
        case "pico/humidity":
          setHumidity(value);
          break;
        case "pico/distance":
          setDistance(value);
          break;
        case "pico/lightlevel":
          setLightLevel(value);
          break;
        default:
          break;
      }
    });

    client.on("error", (err) => console.error("MQTT error:", err));
    client.on("close", () => console.log("MQTT disconnected"));

    return () => {
      if (client.connected) client.end();
    };
  }, []);

  // Socket.IO for photo workflow
  useEffect(() => {
    const socket = io("http://localhost:8000");

    socket.on("connect", () => console.log("Socket.IO connected:", socket.id));

    socket.on("picture_taken", (data) => {
      setPictureStatus(data.message);
      setTimeout(() => setPictureStatus(""), 3000);
    });

    return () => {
      socket.off("picture_taken");
      socket.disconnect();
    };
  }, []);

  const handleTakePhoto = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/take-photo");
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed");
      alert("Photo taken! Output:\n" + json.output);
    } catch (err) {
      console.error(err);
      alert("Error taking photo: " + err.message);
    }
  };

  const sendToOLED = async () => {
    if (!oledText.trim()) return alert("Message cannot be empty!");
    try {
      const res = await fetch("http://localhost:8000/api/update-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: oledText }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      alert("Message sent to OLED!");
    } catch (err) {
      console.error("Error sending to OLED:", err);
      alert("Failed to send message: " + err.message);
    }
  };

  const handleAnalyzeImage = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      alert("Image analyzed and audio generated!");
      setAudioTimestamp(Date.now());
    } catch (err) {
      console.error("Error during image analysis:", err);
      alert("Image analysis failed: " + err.message);
    }
  };

  return (
    <div className="app">
      <img src="/logo_with_name.png" alt="TouchFish Logo" className="site-logo" />
      <h1 className="main-title">TouchFish Operator's Website</h1>

      <div className="camera-canvas">
        <h2 className="section-title">ESP32 Camera Interface</h2>
        
        <div className="camera-images">
          <div className="camera-image-block">
            <h3 className="subsection-title">Live View</h3>
            <img src="http://192.168.50.26:81/stream" alt="ESP32 Live Feed" className="live-stream" />
          </div>
          <div className="camera-image-block">
            <h3 className="subsection-title">Most Recent Picture</h3>
            <img src={`/downloaded_image.jpg?t=${Date.now()}`} alt="Most Recent" className="recent-photo" />
          </div>
        </div>

        <section className="photo-control">
          <button className="take-photo-button" onClick={handleTakePhoto}>Take Photo</button>
          <p>{pictureStatus}</p>
        </section>
      </div>

      <div className="sensor-group">
        <section>
          <h2 className="section-title">Sensor Dashboard</h2>
          <div className="sensor-box">
            <p><strong>Temperature:</strong> {temperature} °C</p>
            <p><strong>Humidity:</strong> {humidity} %</p>
            <p><strong>Distance:</strong> {distance} cm</p>
            <p><strong>Light:</strong> {lightLevel} lm</p>
          </div>
        </section>

        <section>
          <h2 className="section-title">Send Text to OLED</h2>
          <div className="oled-box">
            <input
              type="text"
              placeholder="Type a message"
              value={oledText}
              onChange={(e) => setOledText(e.target.value)}
            />
            <button className="send-to-oled-button" onClick={sendToOLED}>Send to OLED</button>
          </div>
        </section>
      </div>

      <section className="ai-group">
        <h2 className="section-title">Analyze Image & Generate Audio</h2>
        
        <div className="ai-prompt">
          <h3 className="subsection-title">AI Prompt</h3>
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Enter prompt"
          />
          <button className="analyze-image-button" onClick={handleAnalyzeImage}>Analyze Image</button>
        </div>

        <div className="ai-audio">
          <h3 className="subsection-title">Generated Audio</h3>
          <audio controls>
            <source src={`/audio/output.wav?t=${audioTimestamp}`} type="audio/wav" />
            Your browser does not support the audio element.
          </audio>
        </div>
      </section>
    </div>
  );
}

export default App;
