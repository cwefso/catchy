"use client"; // Mark as a Client Component

import { useState } from "react";
import { recognizeSong } from "../lib/audd";
import { addToSpotify } from "../lib/spotify";

export default function Home() {
  const [isListening, setIsListening] = useState(false);

  const startListening = async () => {
    setIsListening(true);

    try {
      // Check for browser support
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        alert("Your browser does not support audio recording.");
        return;
      }

      // Record audio using the Web Audio API
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/wav" });

        // Send audio to AudD API
        const songData = await recognizeSong(blob);
        if (songData && songData.result) {
          const { title, artist } = songData.result;
          alert(`Song Recognized: ${title} by ${artist}`);
          await addToSpotify(songData.result);
        } else {
          alert("No song recognized.");
        }
      };

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 10000); // Record for 10 seconds
    } catch (error) {
      console.error("Error recording audio:", error);
      alert("Failed to record audio.");
    } finally {
      setIsListening(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Song Recognizer</h1>
      <button
        onClick={startListening}
        disabled={isListening}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-400"
      >
        {isListening ? "Listening..." : "Recognize Song"}
      </button>
    </div>
  );
}
