import { useState } from "react";
import { recognizeSong } from "../../lib/shazam";
import { addToSpotify } from "../../lib/spotify";

export const useSongRecognition = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [songDetails, setSongDetails] = useState<{
    title: string;
    artist: string;
  } | null>(null);

  const recognizeAndAddToSpotify = async (audioBlob: Blob) => {
    try {
      const songData = await recognizeSong(audioBlob);
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
    }
  };

  return { isSuccess, error, songDetails, recognizeAndAddToSpotify };
};
