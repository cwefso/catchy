"use client";

import { useCallback, useState, useEffect } from "react";
import { recognizeSong } from "../lib/shazam";
import { addToSpotify } from "../lib/spotify";
import { MicrophoneButton } from "./components/MicrophoneButton";
import { Message } from "./components/Message";

interface SongDetails {
  title: string;
  artist: string;
}

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessComplete, setIsProcessComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [songDetails, setSongDetails] = useState<SongDetails | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      audioStream?.getTracks().forEach((track) => track.stop());
      if (mediaRecorder?.state === "recording") {
        mediaRecorder.stop();
      }
    };
  }, [audioStream, mediaRecorder]);

  const startListening = useCallback(async () => {
    setIsListening(true);
    setError(null);
    setIsProcessComplete(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 44100, sampleSize: 16 },
      });
      setAudioStream(stream);

      const recorder = new MediaRecorder(stream, {
        audioBitsPerSecond: 128000,
        mimeType: "audio/webm;codecs=opus",
      });
      setMediaRecorder(recorder);

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);

      recorder.onstop = async () => {
        setIsProcessing(true);
        try {
          const blob = new Blob(chunks, { type: "audio/webm;codecs=opus" });
          if (blob.size === 0) throw new Error("Recorded audio is empty.");

          const songData = await recognizeSong(blob);
          if (!songData?.track) throw new Error("No song recognized");

          const { title, subtitle } = songData.track;
          await addToSpotify({ title, artist: subtitle });

          setSongDetails({ title, artist: subtitle });
          setIsProcessComplete(true);
          setTimeout(() => setIsProcessComplete(false), 3000);
        } catch (error) {
          setError(
            error instanceof Error ? error.message : "An error occurred"
          );
        } finally {
          setIsListening(false);
          setIsProcessing(false);
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      recorder.start(1000);
      setTimeout(() => recorder.state === "recording" && recorder.stop(), 5000);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to start recording"
      );
      setIsListening(false);
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {error && <Message type="error" message={error} />}

      {isProcessComplete && (
        <Message
          type="success"
          message="Song added to playlist!"
          songDetails={songDetails}
        />
      )}

      <div className="w-full max-w-2xl bg-gray-800/50 rounded-xl p-8 shadow-xl">
        <MicrophoneButton
          isListening={isListening}
          isProcessing={isProcessing}
          isProcessComplete={isProcessComplete}
          onClick={startListening}
        />
      </div>
    </div>
  );
}
