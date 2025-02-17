import axios from "axios";
import { cookies } from "next/headers";

const NEXT_PUBLIC_SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET =
  process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;
const NEXT_PUBLIC_SPOTIFY_REDIRECT_URI =
  process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;
const SPOTIFY_PLAYLIST_ID = process.env.SPOTIFY_PLAYLIST_ID;

if (
  !NEXT_PUBLIC_SPOTIFY_CLIENT_ID ||
  !NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET ||
  !NEXT_PUBLIC_SPOTIFY_REDIRECT_URI ||
  !SPOTIFY_PLAYLIST_ID
) {
  throw new Error(
    "Missing Spotify environment variables. Check your .env file."
  );
}

const getCookie = async (name: string) => {
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value;
};

const setCookie = async (name: string, value: string) => {
  const cookieStore = await cookies();
  cookieStore.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
};

export const getAuthorizationUrl = () => {
  const scopes = [
    "playlist-modify-public",
    "playlist-modify-private",
    "playlist-read-private",
  ];

  const params = new URLSearchParams({
    client_id: NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: NEXT_PUBLIC_SPOTIFY_REDIRECT_URI,
    scope: scopes.join(" "),
    show_dialog: "true",
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export const initializeSpotifyAuth = () => {
  const accessToken = getCookie("spotifyAccessToken");
  const refreshToken = getCookie("spotifyRefreshToken");

  if (!accessToken || !refreshToken) {
    window.location.href = getAuthorizationUrl();
    return false;
  }
  return true;
};

export const exchangeCodeForToken = async (code: string) => {
  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: NEXT_PUBLIC_SPOTIFY_REDIRECT_URI,
        client_id: NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
        client_secret: NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response.data.access_token && response.data.refresh_token) {
      setCookie("spotifyAccessToken", response.data.access_token);
      setCookie("spotifyRefreshToken", response.data.refresh_token);
      return response.data.access_token;
    } else {
      throw new Error("Invalid token response");
    }
  } catch (error) {
    console.error("Error exchanging code for token:", error);
    throw error;
  }
};

export const refreshAccessToken = async () => {
  const refreshToken = await getCookie("spotifyRefreshToken");
  if (!refreshToken) {
    initializeSpotifyAuth();
    throw new Error("No refresh token found. Starting authentication flow.");
  }
  const cookieStore = await cookies();
  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
        client_secret: NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response.data.access_token) {
      setCookie("spotifyAccessToken", response.data.access_token);

      if (response.data.refresh_token) {
        setCookie("spotifyRefreshToken", response.data.refresh_token);
      }
      return response.data.access_token;
    } else {
      throw new Error("Invalid token response");
    }
  } catch (error) {
    console.error("Error refreshing access token:", error);

    cookieStore.delete("spotifyAccessToken");
    cookieStore.delete("spotifyRefreshToken");
    initializeSpotifyAuth();
    throw error;
  }
};

export const searchSpotifyTrack = async (artist: string, title: string) => {
  const accessToken = getCookie("spotifyAccessToken");
  if (!accessToken) {
    initializeSpotifyAuth();
    throw new Error("No access token found. Starting authentication flow.");
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

export const addToSpotify = async (songData: {
  artist: string;
  title: string;
}) => {
  if (!initializeSpotifyAuth()) {
    return;
  }

  let accessToken = getCookie("spotifyAccessToken");
  const playlistId = SPOTIFY_PLAYLIST_ID;
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
