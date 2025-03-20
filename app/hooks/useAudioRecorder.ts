import { useState, useCallback } from "react";

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startRecording = useCallback(async () => {
    setIsRecording(true);
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

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm;codecs=opus" });
        if (blob.size === 0) {
          setError("No audio captured");
        } else {
          setAudioBlob(blob);
        }
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(1000);
      setTimeout(() => recorder.state === "recording" && recorder.stop(), 5000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Audio capture failed");
      setIsRecording(false);
    }
  }, []);

  return { isRecording, audioBlob, error, startRecording };
};
