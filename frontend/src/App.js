import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import mqtt from "mqtt";
import "./App.css";

const socket = io('http://localhost:8000');

function App() {
  const [pictureStatus, setPictureStatus] = useState("");
  const [temperature, setTemperature] = useState("-");
  const [humidity, setHumidity] = useState("-");
  const [distance, setDistance] = useState("-");
  const [lightLevel, setLightLevel] = useState("-");
  const [oledText, setOledText] = useState("");
  const [audioTimestamp, setAudioTimestamp] = useState(Date.now());
  const [prompt, setPrompt] = useState("");


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
    socket.on("connect", () => console.log("Socket.IO connected:", socket.id));

    socket.on("picture_taken", (data) => {
      setPictureStatus(data.message);
      setTimeout(() => setPictureStatus(""), 3000);
    });

    socket.on("analysis_complete", () => {
      alert("Image analyzed and audio generated!");
      setAudioTimestamp(Date.now());
    });

    socket.on("analysis_error", ({ error }) => {
      console.error("Image analysis error:", error);
      alert("Image analysis failed: " + error);
    });

    socket.on("oled_ack", (msg) => alert(msg));
    socket.on("oled_error", (err) => alert("OLED error: " + err));

    return () => {
      socket.off("picture_taken");
      socket.off("analysis_complete");
      socket.off("analysis_error");
      socket.off("oled_ack");
      socket.off("oled_error");
    };
  }, []);

  const handleTakePhoto = () => {
    socket.emit('take_picture');
  };

  const handleAnalyzeImage = e => {
    socket.emit('analyze_image', { prompt });
    setPrompt("");
  }

  const sendToOLED = e => {
    if (!oledText.trim()) return alert("Message cannot be empty!");
    socket.emit("send_to_oled", { text: oledText });
    setOledText("");
  };

  return (
    <div className="app">
      <img src="/logo_with_name.png" alt="TouchFish Logo" className="site-logo" />
      <h1 className="main-title">TouchFish Operator's Website</h1>

      <div className="camera-canvas">
        <h2 className="section-title">ESP32 Camera Most Recent Picture</h2>
        <img src={`/downloaded_image.jpg?t=${Date.now()}`} alt="Most Recent" className="recent-photo" />

        <section className="photo-control">
          <button className="take-photo-button" onClick={handleTakePhoto}>Take Photo</button>
          <p>{pictureStatus}</p>
        </section>
      </div>

      <div className="sensor-group">
        <section>
          <h2 className="section-title">Sensor Dashboard</h2>
          <div className="sensor-box">
            <p><strong>Temperature:</strong> {temperature !== "-" ? parseFloat(temperature).toFixed(2) : "-"} °F</p>
            <p><strong>Humidity:</strong> {humidity !== "-" ? parseFloat(humidity).toFixed(2) : "-"} %</p>
            <p><strong>Distance:</strong> {distance !== "-" ? parseFloat(distance).toFixed(2) : "-"} cm</p>
            <p><strong>Light:</strong> {lightLevel !== "-" ? parseFloat(lightLevel).toFixed(4) : "-"} lm</p>
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
