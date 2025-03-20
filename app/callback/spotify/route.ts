import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    // Handle Spotify error redirects
    if (errorParam) {
      return NextResponse.redirect(
        new URL("/?error=spotify_auth_failed", request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/?error=missing_auth_code", request.url)
      );
    }

    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.redirect(
        new URL("/?error=server_config_error", request.url)
      );
    }

    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${clientId}:${clientSecret}`
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          code: code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      return NextResponse.redirect(
        new URL("/?error=token_exchange_failed", request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const cookieStore = await cookies();

    // Set access token cookie (expires in 1 hour)
    cookieStore.set("spotifyAccessToken", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600, // 1 hour
      path: "/",
    });

    // Set refresh token cookie (expires in 7 days)
    cookieStore.set("spotifyRefreshToken", tokenData.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 604800, // 7 days
      path: "/",
    });

    // Successful authentication redirect
    return NextResponse.redirect(
      new URL("/?spotify_auth=success", request.url)
    );
  } catch (error) {
    console.error("Spotify callback error:", error);
    return NextResponse.redirect(
      new URL("/?error=internal_server_error", request.url)
    );
  }
}
