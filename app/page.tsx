"use client";

import { useCallback, useState, useEffect } from "react";
import { recognizeSong } from "../lib/shazam";
import { addToSpotify } from "../lib/spotify";
import { MicrophoneButton } from "./components/MicrophoneButton";
import { Message } from "./components/Message";
import {
  getTokens,
  refreshAccessToken,
  getSpotifyAuthUrl,
} from "./actions/spotify";

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
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);

  // Check Spotify connection status on mount
  useEffect(() => {
    const checkSpotifyConnection = async () => {
      try {
        let { accessToken } = await getTokens();
        const { refreshToken } = await getTokens();

        if (!accessToken && refreshToken) {
          accessToken = await refreshAccessToken();
        }

        setIsSpotifyConnected(!!accessToken);
      } catch (error) {
        console.error("Spotify connection check failed:", error);
        setIsSpotifyConnected(false);
      }
    };

    checkSpotifyConnection();
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      audioStream?.getTracks().forEach((track) => track.stop());
      if (mediaRecorder?.state === "recording") {
        mediaRecorder.stop();
      }
    };
  }, [audioStream, mediaRecorder]);

  const handleConnectSpotify = async () => {
    try {
      const authUrl = await getSpotifyAuthUrl();
      window.location.href = authUrl;
    } catch {
      setError("Failed to connect to Spotify. Please try again.");
    }
  };

  const startListening = useCallback(async () => {
    if (!isSpotifyConnected) {
      setError("Please connect your Spotify account first");
      return;
    }

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
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

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
          setAudioStream(null);
          setMediaRecorder(null);
        }
      };

      recorder.start(1000);
      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 5000);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to start recording"
      );
      setIsListening(false);
    }
  }, [isSpotifyConnected]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {!isSpotifyConnected && (
        <div className="mb-8 text-center">
          <Message
            type="error"
            message="Connect your Spotify account to save songs to your playlist"
          />
          <button
            onClick={handleConnectSpotify}
            className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
          >
            Connect Spotify
          </button>
        </div>
      )}

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
          disabled={!isSpotifyConnected}
        />
      </div>
    </div>
  );
}
