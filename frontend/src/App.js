import React, { useState, useEffect } from "react";
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:8000');

function App() {
  const [pictureStatus, setPictureStatus] = useState("");
  const [prompt, setPrompt] = useState("")
  const [audioSrc, setAudioSrc] = useState("");

  useEffect(() => {
    socket.on('connect', () => console.log('Connected:', socket.id));
    socket.on('picture_taken', data => {
      setPictureStatus(data.message);
      setTimeout(() => setPictureStatus(""), 3000); // Clear status after 3 seconds
    });
    return () => {
      socket.off('picture_taken');
    };
  }, []);

  const handleTakePhoto = () => {
    socket.emit('take_picture');
  };


  const handleAnalyzeImage = async () => {
    try {
      const res = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      if (!res.ok) throw new Error("AI analysis failed");
      const { audioPath } = await res.json();
      setAudioSrc(audioPath + `?t=${Date.now()}`); // bust cache
    } catch (err) {
      console.error(err);
      alert("Error analyzing image");
    }
  };


  return (
    <div className="app">
      <h1>ESP32 Camera Interface</h1>
      <div>
        <h2>Live Feed</h2>
        <img src="http://172.20.10.9:COM7/stream" alt="Live Camera Feed" />
      </div>
      <div>
        <h2>Most Recent Photo</h2>
        <img src={`/downloaded_image.jpg?t=${Date.now()}`} alt="Most Recent Photo" />
      </div>
      <div>
        <button onClick={handleTakePhoto}>Take Photo</button>
      </div>

      <div>
        <h2>AI Prompt</h2>
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Enter prompt"
        />
        <button onClick={handleAnalyzeImage}>Analyze Image</button>
      </div>

      {audioSrc && (
        <div>
          <h2>AI Audio Response</h2>
          <audio controls src={audioSrc}></audio>
        </div>
      )}

    </div>
  );
}

export default App;
