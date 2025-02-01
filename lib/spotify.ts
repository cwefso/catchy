import axios from "axios";

const SPOTIFY_CLIENT_ID = `${process.env.SPOTIFY_CLIENT_ID}`;
const SPOTIFY_CLIENT_SECRET = `${process.env.SPOTIFY_CLIENT_SECRET}`;
const SPOTIFY_REDIRECT_URI = `${process.env.SPOTIFY_REDIRECT_URI}`;

// Generate the authorization URL
export const getAuthorizationUrl = () => {
  const scopes = [
    "playlist-modify-public",
    "playlist-modify-private",
    "playlist-read-private",
  ];

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: scopes.join(" "),
    show_dialog: "true",
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

// Initialize Spotify authentication
export const initializeSpotifyAuth = () => {
  const accessToken = localStorage.getItem("spotifyAccessToken");
  const refreshToken = localStorage.getItem("spotifyRefreshToken");

  if (!accessToken || !refreshToken) {
    // Redirect to Spotify authorization if no tokens exist
    window.location.href = getAuthorizationUrl();
    return false;
  }
  return true;
};

// Exchange the authorization code for an access token
export const exchangeCodeForToken = async (code: string) => {
  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        client_id: SPOTIFY_CLIENT_ID,
        client_secret: SPOTIFY_CLIENT_SECRET,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response.data.access_token && response.data.refresh_token) {
      localStorage.setItem("spotifyAccessToken", response.data.access_token);
      localStorage.setItem("spotifyRefreshToken", response.data.refresh_token);
      return response.data.access_token;
    } else {
      throw new Error("Invalid token response");
    }
  } catch (error) {
    console.error("Error exchanging code for token:", error);
    throw error;
  }
};

// Refresh the access token using the refresh token
export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("spotifyRefreshToken");
  if (!refreshToken) {
    // If no refresh token exists, start the auth flow again
    initializeSpotifyAuth();
    throw new Error("No refresh token found. Starting authentication flow.");
  }

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: SPOTIFY_CLIENT_ID,
        client_secret: SPOTIFY_CLIENT_SECRET,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response.data.access_token) {
      localStorage.setItem("spotifyAccessToken", response.data.access_token);
      // Some implementations also provide a new refresh token
      if (response.data.refresh_token) {
        localStorage.setItem(
          "spotifyRefreshToken",
          response.data.refresh_token
        );
      }
      return response.data.access_token;
    } else {
      throw new Error("Invalid token response");
    }
  } catch (error) {
    console.error("Error refreshing access token:", error);
    // Clear tokens and restart auth flow on refresh failure
    localStorage.removeItem("spotifyAccessToken");
    localStorage.removeItem("spotifyRefreshToken");
    initializeSpotifyAuth();
    throw error;
  }
};

// Search for a track on Spotify using the artist and title
export const searchSpotifyTrack = async (artist: string, title: string) => {
  const accessToken = localStorage.getItem("spotifyAccessToken");
  if (!accessToken) {
    // Initialize auth if no access token exists
    initializeSpotifyAuth();
    throw new Error("No access token found. Starting authentication flow.");
  }

  try {
    const simplifiedTitle = title.replace(/\(.*\)/, "").trim(); // Remove anything in parentheses
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
  // Check for tokens before proceeding
  if (!initializeSpotifyAuth()) {
    return; // Auth flow will handle the redirect
  }

  let accessToken = localStorage.getItem("spotifyAccessToken");
  const playlistId = "0qiJyAxESNqy4AynkpHerX";
  const { artist, title } = songData;

  try {
    const trackUri = await searchSpotifyTrack(artist, title);
    if (!trackUri) {
      throw new Error("Track not found on Spotify.");
    }

    await axios.post(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      { uris: [trackUri] },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    alert("Song added to Spotify playlist!");
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      // Handle Axios errors
      if (error.response?.status === 401) {
        try {
          accessToken = await refreshAccessToken();
          await addToSpotify(songData); // Retry the operation
        } catch (refreshError) {
          console.error("Error refreshing token:", refreshError);
          alert("Authentication failed. Please try again.");
        }
      } else {
        console.error("Error adding song to Spotify playlist:", error);
        alert("Failed to add song to Spotify playlist.");
      }
    } else if (error instanceof Error) {
      // Handle generic errors
      console.error("Unexpected error:", error.message);
      alert("An unexpected error occurred.");
    } else {
      // Handle cases where the error is not an Error object
      console.error("Unexpected error:", error);
      alert("An unexpected error occurred.");
    }
  }
};
