// app/actions/spotify.ts
"use server"; // Mark this as a Server Action

import { cookies } from "next/headers";
import axios from "axios";

const NEXT_PUBLIC_SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET =
  process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;
const NEXT_PUBLIC_SPOTIFY_REDIRECT_URI =
  process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;

if (
  !NEXT_PUBLIC_SPOTIFY_CLIENT_ID ||
  !NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET ||
  !NEXT_PUBLIC_SPOTIFY_REDIRECT_URI
) {
  throw new Error(
    "Missing Spotify environment variables. Check your .env file."
  );
}

// Helper function to get cookies
export const getTokens = async () => {
  const cookieStore = await cookies(); // Await the cookies() function
  const accessToken = cookieStore.get("spotifyAccessToken")?.value;
  const refreshToken = cookieStore.get("spotifyRefreshToken")?.value;
  return { accessToken, refreshToken };
};

// Helper function to set cookies
const setCookie = async (name: string, value: string) => {
  const cookieStore = await cookies(); // Await the cookies() function
  cookieStore.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
};

// Exchange the authorization code for an access token
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
      await setCookie("spotifyAccessToken", response.data.access_token);
      await setCookie("spotifyRefreshToken", response.data.refresh_token);
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
  const { refreshToken } = await getTokens(); // Await getTokens()
  if (!refreshToken) {
    throw new Error("No refresh token found. Please re-authenticate.");
  }

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
      await setCookie("spotifyAccessToken", response.data.access_token);
      if (response.data.refresh_token) {
        await setCookie("spotifyRefreshToken", response.data.refresh_token);
      }
      return response.data.access_token;
    } else {
      throw new Error("Invalid token response");
    }
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw error;
  }
};
