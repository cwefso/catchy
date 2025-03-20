import axios from "axios";
import { getTokens, refreshAccessToken } from "../app/actions/spotify";

const SPOTIFY_PLAYLIST_ID = process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_ID;

if (!SPOTIFY_PLAYLIST_ID) {
  throw new Error("Missing Spotify playlist ID. Check your .env file.");
}

export const searchSpotifyTrack = async (artist: string, title: string) => {
  try {
    // Get tokens
    let { accessToken, refreshToken } = await getTokens();

    // If no access token but we have a refresh token, try refreshing
    if (!accessToken && refreshToken) {
      accessToken = await refreshAccessToken();
    }

    // If we still don't have a token, silently fail
    if (!accessToken) {
      console.log("No Spotify authentication available for search.");
      return null;
    }

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
    return null;
  }
};

export const addToSpotify = async (songData: {
  artist: string;
  title: string;
}) => {
  const { artist, title } = songData;

  const addTrackToPlaylist = async (retryCount = 0): Promise<boolean> => {
    const MAX_RETRIES = 3;

    try {
      // Get tokens
      let { accessToken, refreshToken } = await getTokens();

      // If no access token but we have a refresh token, try refreshing
      if (!accessToken && refreshToken) {
        console.log(
          "No access token, but found refresh token. Attempting to refresh..."
        );
        accessToken = await refreshAccessToken();
      }

      // If we still don't have a token, silently fail but return false to indicate failure
      if (!accessToken) {
        console.log("No authentication tokens available.");
        return false;
      }

      const trackUri = await searchSpotifyTrack(artist, title);
      if (!trackUri) {
        console.log("Track not found on Spotify.");
        return false;
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
      return true;
    } catch (error: unknown) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401 &&
        retryCount < MAX_RETRIES
      ) {
        console.log("Token expired. Attempting to refresh...");

        // Try refreshing token and retry
        await refreshAccessToken();
        // Wait a short time for the cookies to be properly set
        await new Promise((resolve) => setTimeout(resolve, 300));

        return addTrackToPlaylist(retryCount + 1);
      }

      console.error("Error in playlist operation:", error);
      return false;
    }
  };

  try {
    // Note: We don't show any alerts here, just return success or failure
    return await addTrackToPlaylist();
  } catch (error) {
    console.error("Unhandled error in addToSpotify:", error);
    return false;
  }
};
