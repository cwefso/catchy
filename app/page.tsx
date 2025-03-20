"use client";

import { useCallback, useState } from "react";
import { recognizeSong } from "../lib/shazam";
import { addToSpotify } from "../lib/spotify";
import { ClipLoader } from "react-spinners";
import {
  FaCheckCircle,
  FaMicrophone,
  FaExclamationCircle,
} from "react-icons/fa";

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [songDetails, setSongDetails] = useState<{
    title: string;
    artist: string;
  } | null>(null);

  // Start listening for audio
  const startListening = useCallback(async () => {
    setIsListening(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          sampleSize: 16,
        },
      });

      const options = {
        audioBitsPerSecond: 128000,
        mimeType: "audio/webm;codecs=opus",
      };

      const recorder = new MediaRecorder(stream, options);

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);

      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: "audio/webm;codecs=opus" });
          if (blob.size === 0) throw new Error("No audio captured");

          const songData = await recognizeSong(blob);
          if (!songData?.track) throw new Error("Song recognition failed");

          const { title, subtitle } = songData.track;
          await addToSpotify({ title, artist: subtitle });
          setSongDetails({ title, artist: subtitle });
          setIsSuccess(true);

          setTimeout(() => {
            setIsSuccess(false);
            setSongDetails(null);
          }, 3000);
        } catch (error) {
          setError(error instanceof Error ? error.message : "Analysis failed");
        } finally {
          setIsListening(false);
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      recorder.start(1000);
      setTimeout(() => recorder.state === "recording" && recorder.stop(), 5000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Audio capture failed");
      setIsListening(false);
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-900 text-white">
      {error && (
        <div className="flex items-center mb-4 p-3 bg-red-800/30 rounded-lg">
          <FaExclamationCircle className="mr-2 text-red-500" />
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {isSuccess && (
        <div className="flex flex-col items-center mb-8 p-4 bg-green-800/30 rounded-lg">
          <FaCheckCircle className="text-green-500 text-4xl mb-2" />
          <p className="text-lg">Song added to playlist!</p>
          {songDetails && (
            <p className="mt-1 text-gray-300 text-center">
              {songDetails.title} by {songDetails.artist}
            </p>
          )}
        </div>
      )}

      <div className="w-full max-w-2xl bg-gray-800/50 rounded-xl p-8 shadow-xl">
        <div className="flex flex-col items-center mt-8">
          {isListening ? (
            <div className="flex flex-col items-center">
              <ClipLoader color="#3b82f6" size={40} />
              <p className="mt-3 text-gray-300">Listening...</p>
            </div>
          ) : (
            <button
              onClick={startListening}
              disabled={isListening}
              className={`p-8 rounded-full transition-colors ${
                isListening
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              <FaMicrophone className="text-white text-6xl" />
            </button>
          )}
          <p className="mt-4 text-gray-400 text-center">
            Click to identify from microphone
          </p>
        </div>
      </div>
    </div>
  );
}
