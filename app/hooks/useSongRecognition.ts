// //hooks/useSongRecognition.ts

// import { useState, useCallback } from "react";
// import { recognizeSong } from "../../lib/shazam";
// import { addToSpotify } from "../../lib/spotify";

// export const useSongRecognition = () => {
//   const [isSuccess, setIsSuccess] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [songDetails, setSongDetails] = useState<{
//     title: string;
//     artist: string;
//   } | null>(null);

//   // Function to reset error state
//   const resetRecognitionError = useCallback(() => {
//     setError(null);
//   }, []);

//   const recognizeAndAddToSpotify = async (audioBlob: Blob) => {
//     try {
//       resetRecognitionError(); // Clear any previous errors

//       const songData = await recognizeSong(audioBlob);
//       if (!songData?.track) throw new Error("Song recognition failed");

//       const { title, subtitle } = songData.track;
//       await addToSpotify({ title, artist: subtitle });
//       setSongDetails({ title, artist: subtitle });
//       setIsSuccess(true);

//       // No need for this timeout here, as we're handling it in the parent component
//       // setTimeout(() => {
//       //   setIsSuccess(false);
//       //   setSongDetails(null);
//       // }, 3000);

//       return true; // Return success for promise chaining
//     } catch (error) {
//       setError(error instanceof Error ? error.message : "Analysis failed");
//       throw error; // Re-throw to allow catch in parent component
//     }
//   };

//   return {
//     isSuccess,
//     error,
//     songDetails,
//     recognizeAndAddToSpotify,
//     resetRecognitionError,
//   };
// };
