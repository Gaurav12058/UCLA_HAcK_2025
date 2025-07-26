import React, { useState, useEffect } from "react";
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:8000');

function App() {
  const [pictureStatus, setPictureStatus] = useState("");
  const [oledText, setoledText] = useState("")

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
    </div>
  );
}

export default App;
