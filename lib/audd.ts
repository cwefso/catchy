import axios from "axios";

interface AudDResponse {
  result?: {
    title: string;
    artist: string;
    spotify?: {
      uri: string;
    };
  };
  error?: string;
}

const API_KEY = "4e7afc3f0427d2ac69f68bc7f13a25df"; // Replace with your AudD API key

export const recognizeSong = async (audioBlob: Blob) => {
  try {
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.wav");
    formData.append("api_token", API_KEY);

    const response = await fetch("https://api.audd.io/", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error recognizing song:", error);
    return null;
  }
};
