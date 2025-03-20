import { useState, useRef, useCallback } from "react";

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Function to reset error state
  const resetRecordingError = useCallback(() => {
    setError(null);
  }, []);

  const startRecording = useCallback(async () => {
    // Don't start a new recording if already recording
    if (isRecording) return;

    try {
      // Reset previous state
      resetRecordingError();
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        setIsRecording(false);

        // Stop all tracks in the stream
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);

      // Automatically stop recording after 6 seconds
      setTimeout(() => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === "recording"
        ) {
          mediaRecorderRef.current.stop();
        }
      }, 6000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start recording"
      );
      setIsRecording(false);
    }
  }, [isRecording, resetRecordingError]);

  return {
    isRecording,
    audioBlob,
    error,
    startRecording,
    resetRecordingError,
  };
};
