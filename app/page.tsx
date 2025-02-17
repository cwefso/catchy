// page.tsx
"use client";

import { useCallback, useState, useEffect } from "react";
import { recognizeSong } from "../lib/shazam";
import { addToSpotify } from "../lib/spotify";
import { ClipLoader } from "react-spinners";
import {
  FaCheckCircle,
  FaMicrophone,
  FaExclamationCircle,
} from "react-icons/fa";

interface SongDetails {
  title: string;
  artist: string;
}

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [songDetails, setSongDetails] = useState<SongDetails | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
      }
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
    };
  }, [audioStream, mediaRecorder]);

  const startListening = useCallback(async () => {
    setIsListening(true);
    setError(null);

    try {
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        throw new Error("Your browser does not support audio recording.");
      }

      // Configure audio constraints for better quality
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          sampleSize: 16,
        },
      });
      setAudioStream(stream);

      // Use higher quality audio encoding
      const options = {
        audioBitsPerSecond: 128000,
        mimeType: "audio/webm;codecs=opus",
      };

      const recorder = new MediaRecorder(stream, options);
      setMediaRecorder(recorder);

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: "audio/webm;codecs=opus" });

          if (blob.size === 0) {
            throw new Error("Recorded audio is empty.");
          }

          const songData = await recognizeSong(blob);

          if (songData?.track) {
            // Check for track object directly
            const { title, subtitle } = songData.track; // These are the correct fields from the API

            await addToSpotify({ title, artist: subtitle });
            setSongDetails({ title, artist: subtitle });
            setIsSuccess(true);

            setTimeout(() => {
              setIsSuccess(false);
              setSongDetails(null);
            }, 3000);
          } else {
            throw new Error(
              "No song recognized. Please try again with clearer audio."
            );
          }
        } catch (error) {
          console.error("Error processing audio:", error);
          setError(
            error instanceof Error ? error.message : "An unknown error occurred"
          );
        } finally {
          setIsListening(false);
          stream.getTracks().forEach((track) => track.stop());
          setAudioStream(null);
          setMediaRecorder(null);
        }
      };

      // Start recording with a data interval of 1 second
      recorder.start(1000);

      // Record for 5 seconds instead of 10 for quicker testing
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      }, 5000);
    } catch (error) {
      console.error("Error starting recording:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      setIsListening(false);
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {error && (
        <div className="flex items-center mb-4 text-red-500">
          <FaExclamationCircle className="mr-2" />
          <p>{error}</p>
        </div>
      )}

      {isListening ? (
        <div className="flex flex-col items-center">
          <ClipLoader color="#3b82f6" size={40} />
          <p className="mt-2">Listening...</p>
        </div>
      ) : isSuccess ? (
        <div className="flex flex-col items-center">
          <FaCheckCircle className="text-green-500 text-4xl" />
          <p className="mt-2">Song added to playlist!</p>
          {songDetails && (
            <p className="mt-2 text-center">
              {songDetails.title} by {songDetails.artist}
            </p>
          )}
        </div>
      ) : (
        <button
          onClick={startListening}
          disabled={isListening}
          className="p-12 bg-gray-100 hover:bg-gray-200 transition-colors rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <FaMicrophone className="text-black text-8xl" />
        </button>
      )}
    </div>
  );
}
