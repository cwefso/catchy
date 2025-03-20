"use server";

import { cookies } from "next/headers";
import axios from "axios";

const NEXT_PUBLIC_SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET =
  process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;
const NEXT_PUBLIC_SPOTIFY_REDIRECT_URI =
  process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;

// Validate environment variables first
if (
  !NEXT_PUBLIC_SPOTIFY_CLIENT_ID ||
  !NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET ||
  !NEXT_PUBLIC_SPOTIFY_REDIRECT_URI
) {
  throw new Error(
    "Missing Spotify environment variables. Check your .env file."
  );
}

// Spotify OAuth URL generator
export const getSpotifyAuthUrl = async () => {
  const params = new URLSearchParams({
    client_id: NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: NEXT_PUBLIC_SPOTIFY_REDIRECT_URI,
    scope: "playlist-modify-public playlist-modify-private",
    show_dialog: "true",
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

// Get stored tokens
export const getTokens = async () => {
  const cookieStore = await cookies();
  return {
    accessToken: cookieStore.get("spotifyAccessToken")?.value,
    refreshToken: cookieStore.get("spotifyRefreshToken")?.value,
  };
};

// Store tokens in cookies
const setCookie = async (name: string, value: string) => {
  const cookieStore = await cookies();
  cookieStore.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
};

// Exchange authorization code for tokens
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

    const { access_token, refresh_token } = response.data;

    await setCookie("spotifyAccessToken", access_token);
    await setCookie("spotifyRefreshToken", refresh_token);

    return access_token;
  } catch (error) {
    console.error("Token exchange error:", error);
    throw new Error("Failed to authenticate with Spotify");
  }
};

// Refresh access token
export const refreshAccessToken = async () => {
  try {
    const { refreshToken } = await getTokens();
    if (!refreshToken) throw new Error("No refresh token available");

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

    const { access_token, refresh_token } = response.data;

    await setCookie("spotifyAccessToken", access_token);
    if (refresh_token) {
      await setCookie("spotifyRefreshToken", refresh_token);
    }

    return access_token;
  } catch (error) {
    console.error("Token refresh error:", error);
    throw new Error("Failed to refresh access token");
  }
};
