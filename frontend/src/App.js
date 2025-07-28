import React, { useState, useEffect } from "react";
import io from "socket.io-client";
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


  // Socket.IO
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

    socket.on("temp", setTemperature);
    socket.on("humidity", setHumidity);
    socket.on("ultrasonic", setDistance);
    socket.on("light", setLightLevel);

    return () => {
      socket.off("picture_taken");
      socket.off("analysis_complete");
      socket.off("analysis_error");
      socket.off("oled_ack");
      socket.off("oled_error");
      socket.off("temp");
      socket.off("humidity");
      socket.off("ultrasonic");
      socket.off("light");
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
