"use client"; // Mark as a Client Component

import { useEffect, useState } from "react";
import { recognizeSong } from "../lib/audd";
import { addToSpotify } from "../lib/spotify";
import { ClipLoader } from "react-spinners"; // Import a spinner
import { FaCheckCircle, FaMusic } from "react-icons/fa"; // Import a check mark icon

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    console.log("is listening: ", isListening);
  }, [isListening]);

  const startListening = async () => {
    setIsListening(true);

    try {
      // Check for browser support
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        console.log("Your browser does not support audio recording.");
        setIsListening(false); // Reset state if recording is not supported
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
          console.log(`Song Recognized: ${title} by ${artist}`);
          await addToSpotify(songData.result);
          setIsSuccess(true); // Set success state
          setTimeout(() => setIsSuccess(false), 3000); // Reset after 3 seconds
        } else {
          console.log("No song recognized.");
        }
        setIsListening(false); // Reset state after processing is complete
      };

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 6000); // Record for 6 seconds
    } catch (error) {
      console.error("Error recording audio:", error);
      console.log("Failed to record audio.");
      setIsListening(false); // Reset state on error
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {isListening ? (
        <div className="flex flex-col items-center">
          <ClipLoader color="#3b82f6" size={40} /> {/* Loading spinner */}
          <p className="mt-2">Listening...</p>
        </div>
      ) : isSuccess ? (
        <div className="flex flex-col items-center">
          <FaCheckCircle className="text-green-500 text-4xl" />{" "}
          {/* Green check mark */}
          <p className="mt-2">You hooked one!</p>
        </div>
      ) : (
        <button
          onClick={startListening}
          disabled={isListening}
          className="p-24 bg-gray-100 text-white rounded-lg disabled:bg-gray-400"
        >
          <FaMusic className="text-black text-6xl" />{" "}
        </button>
      )}
    </div>
  );
}
