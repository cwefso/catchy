"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { recognizeSong } from "../lib/shazam";
import { addToSpotify } from "../lib/spotify";
import { ClipLoader } from "react-spinners";
import {
  FaCheckCircle,
  FaMicrophone,
  FaExclamationCircle,
  FaLink,
  FaPlay,
  FaPause,
} from "react-icons/fa";

// YouTube URL validation functions
const isYouTubeUrl = (url: string): boolean => {
  const patterns = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=([^&]{11})/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/([^&]{11})/,
    /^(https?:\/\/)?(www\.)?youtu\.be\/([^&]{11})/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/v\/([^&]{11})/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/live\/([^&]{11})/,
  ];
  return patterns.some((pattern) => pattern.test(url));
};

const extractVideoId = (url: string): string | null => {
  const patterns = [
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]{11}).*/,
    /^.*(youtube.com\/live\/)([^#&?]{11}).*/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[2].length === 11) {
      return match[2];
    }
  }
  return null;
};

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [songDetails, setSongDetails] = useState<{
    title: string;
    artist: string;
  } | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isYoutubeAPIReady, setIsYoutubeAPIReady] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const playerRef = useRef<YT.Player | null>(null);

  // Load YouTube API
  useEffect(() => {
    const loadYouTubeAPI = () => {
      if (!document.getElementById("youtube-api")) {
        const tag = document.createElement("script");
        tag.id = "youtube-api";
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
          setIsYoutubeAPIReady(true);
        };
      } else if (window.YT && window.YT.Player) {
        setIsYoutubeAPIReady(true);
      }
    };

    loadYouTubeAPI();

    return () => {
      if (window.onYouTubeIframeAPIReady) {
        delete window.onYouTubeIframeAPIReady;
      }
    };
  }, []);

  // Initialize YouTube player
  useEffect(() => {
    if (isYoutubeAPIReady && videoId && !playerRef.current) {
      try {
        playerRef.current = new window.YT.Player("youtube-player", {
          height: "240",
          width: "426",
          videoId: videoId,
          playerVars: {
            controls: 1,
            rel: 0,
            origin: "http://localhost:3000",
            enablejsapi: 1,
            modestbranding: 1,
            fs: 1,
            iv_load_policy: 3,
            playsinline: 1,
          },
          events: {
            onReady: () => {
              console.log("YouTube player ready");
            },
            onStateChange: (event: YT.OnStateChangeEvent) => {
              setIsVideoPlaying(event.data === window.YT.PlayerState.PLAYING);
            },
            onError: (event: YT.OnErrorEvent) => {
              setError(`YouTube player error: ${event.data}`);
            },
          },
        });
      } catch (error) {
        console.error("Failed to initialize YouTube player:", error);
        setError("Failed to initialize YouTube player");
      }
    }
  }, [isYoutubeAPIReady, videoId]);

  // Handle YouTube URL submission
  const handleYoutubeUrl = () => {
    if (!isYouTubeUrl(youtubeUrl)) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    const extractedId = extractVideoId(youtubeUrl);
    if (!extractedId) {
      setError("Could not extract video ID from URL");
      return;
    }

    setVideoId(extractedId);
    setError(null);
  };

  // Capture system audio
  const captureSystemAudio = async (): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: false,
        audio: true,
      });

      stream.getTracks().forEach((track) => {
        track.onended = () => {
          setIsListening(false);
        };
      });

      return stream;
    } catch {
      throw new Error("System audio access denied or not supported");
    }
  };

  // Start listening for audio
  const startListening = useCallback(async () => {
    setIsListening(true);
    setError(null);

    try {
      const stream =
        videoId && isVideoPlaying
          ? await captureSystemAudio()
          : await navigator.mediaDevices.getUserMedia({
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
  }, [videoId, isVideoPlaying]);

  // Toggle play/pause for YouTube player
  const togglePlayPause = () => {
    if (!playerRef.current) return;

    if (isVideoPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

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
        <div className="mb-8">
          <div className="flex items-center bg-gray-700 rounded-lg p-3">
            <FaLink className="text-gray-400 mr-3" />
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Paste YouTube URL here"
              className="w-full bg-transparent outline-none placeholder-gray-400"
              disabled={isListening}
            />
          </div>
          <button
            onClick={handleYoutubeUrl}
            disabled={!youtubeUrl || isListening}
            className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Load Video
          </button>
        </div>

        {videoId && (
          <div className="my-8">
            <div className="bg-black rounded-lg overflow-hidden">
              <div id="youtube-player" className="w-full aspect-video"></div>
            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={togglePlayPause}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center"
                disabled={!isYoutubeAPIReady}
              >
                {isVideoPlaying ? <FaPause /> : <FaPlay />}
                <span className="ml-2">
                  {isVideoPlaying ? "Pause" : "Play"}
                </span>
              </button>
            </div>
          </div>
        )}

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
            {videoId
              ? "Play the video then click to identify"
              : "Click to identify from microphone"}
          </p>
        </div>

        <p className="mt-6 text-xs text-gray-400 text-center">
          YouTube is a trademark of Google LLC. This implementation complies
          with YouTube&apos;s API Services Terms of Service. Audio analysis
          provided by Shazam.
        </p>
      </div>
    </div>
  );
}
