"use client";

import { useEffect } from "react";
import { useAudioRecorder } from "./hooks/useAudioRecorder";
import { useSongRecognition } from "./hooks/useSongRecognition";
import { Message } from "./components/Message";
import { MicrophoneButton } from "./components/MicrophoneButton";

export default function Home() {
  const {
    isRecording,
    audioBlob,
    error: recordingError,
    startRecording,
  } = useAudioRecorder();
  const {
    isSuccess,
    error: recognitionError,
    songDetails,
    recognizeAndAddToSpotify,
  } = useSongRecognition();

  useEffect(() => {
    if (audioBlob) {
      recognizeAndAddToSpotify(audioBlob);
    }
  }, [audioBlob, recognizeAndAddToSpotify]);

  const error = recordingError || recognitionError;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4  text-white">
      {error && <Message type="error" message={error} />}
      {isSuccess && (
        <Message
          type="success"
          message="Song added to playlist!"
          songDetails={songDetails}
        />
      )}

      <div className="w-full max-w-2xl bg-gray-800/50 rounded-xl p-8 shadow-xl">
        <MicrophoneButton isListening={isRecording} onClick={startRecording} />
      </div>
    </div>
  );
}
