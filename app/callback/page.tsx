"use client"; // Mark as a Client Component

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { exchangeCodeForToken } from "../../lib/spotify";

export default function Callback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");

  useEffect(() => {
    if (code) {
      exchangeCodeForToken(code)
        .then(() => router.push("/"))
        .catch((error) =>
          console.error("Error exchanging code for token:", error)
        );
    }
  }, [code]);

  return <p>Loading...</p>;
}
