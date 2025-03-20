// shazam.ts
const API_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
const API_HOST = "shazam.p.rapidapi.com";

if (!API_KEY) {
  throw new Error(
    "Shazam API key is missing. Please set the NEXT_PUBLIC_RAPIDAPI_KEY environment variable."
  );
}

interface ShazamTrack {
  matches?: Array<{
    id: string;
    offset: number;
    timeskew: number;
    frequencyskew: number;
  }>;
  timestamp?: number;
  timezone?: string;
  tagid?: string;
  track?: {
    layout: string;
    type: string;
    key: string;
    title: string;
    subtitle: string;
    images?: {
      background: string;
      coverart: string;
      coverarthq: string;
    };
    sections?: Array<{
      type: string;
      metadata?: Array<{
        title: string;
        text: string;
      }>;
    }>;
    url: string;
    artists?: Array<{
      id: string;
      adamid: string;
    }>;
    isrc?: string;
    genres?: {
      primary: string;
    };
  };
}

export const recognizeSong = async (
  audioBlob: Blob
): Promise<ShazamTrack | null> => {
  try {
    // Convert audio to raw PCM data
    const audioContext = new (window.AudioContext || window.AudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(
      await audioBlob.arrayBuffer()
    );
    // Get the raw audio data
    const rawData = audioBuffer.getChannelData(0);

    // Convert to 16-bit PCM
    const samples = new Int16Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
      samples[i] = rawData[i] * 32767;
    }

    // Convert to base64
    const base64Audio = Buffer.from(samples.buffer).toString("base64");

    const headers = {
      "X-RapidAPI-Key": API_KEY,
      "X-RapidAPI-Host": API_HOST,
      "Content-Type": "text/plain",
    };

    const response = await fetch(
      "https://shazam.p.rapidapi.com/songs/v2/detect",
      {
        method: "POST",
        headers: headers,
        body: base64Audio,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Shazam API Error:", errorText);
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Error recognizing song:", error);
    throw error;
  }
};
