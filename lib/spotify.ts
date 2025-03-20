// lib/spotify.ts
import axios from "axios";
import { getTokens, refreshAccessToken } from "../app/actions/spotify";

const SPOTIFY_PLAYLIST_ID = process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_ID;

if (!SPOTIFY_PLAYLIST_ID) {
  throw new Error("Missing Spotify playlist ID. Check your .env file.");
}

// Search for a track on Spotify using the artist and title
export const searchSpotifyTrack = async (artist: string, title: string) => {
  const { accessToken } = await getTokens();
  if (!accessToken) {
    throw new Error("No access token found. Please re-authenticate.");
  }

  try {
    const simplifiedTitle = title.replace(/\(.*\)/, "").trim();
    const query = `track:${simplifiedTitle} artist:${artist}`;
    const response = await axios.get("https://api.spotify.com/v1/search", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        q: query,
        type: "track",
        limit: 1,
      },
    });

    if (response.data.tracks.items.length > 0) {
      return response.data.tracks.items[0].uri;
    }
    return null;
  } catch (error) {
    console.error("Error searching for track on Spotify:", error);
    throw error;
  }
};

// Add a track to a Spotify playlist
export const addToSpotify = async (songData: {
  artist: string;
  title: string;
}) => {
  let { accessToken } = await getTokens();
  const { artist, title } = songData;

  try {
    const trackUri = await searchSpotifyTrack(artist, title);
    if (!trackUri) {
      throw new Error("Track not found on Spotify.");
    }

    await axios.post(
      `https://api.spotify.com/v1/playlists/${SPOTIFY_PLAYLIST_ID}/tracks`,
      { uris: [trackUri] },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Song added to Spotify playlist!");
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        try {
          accessToken = await refreshAccessToken();
          await addToSpotify(songData);
        } catch (refreshError) {
          console.error("Error refreshing token:", refreshError);
          alert("Authentication failed. Please try again.");
        }
      } else {
        console.error("Error adding song to Spotify playlist:", error);
        alert("Failed to add song to Spotify playlist.");
      }
    } else if (error instanceof Error) {
      console.error("Unexpected error:", error.message);
      alert("An unexpected error occurred.");
    } else {
      console.error("Unexpected error:", error);
      alert("An unexpected error occurred.");
    }
  }
};
