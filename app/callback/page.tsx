"use client"; // Mark as a Client Component

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { exchangeCodeForToken } from "../../lib/spotify";

function CallbackContent() {
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
  }, [code, router]);

  return <p>Loading...</p>;
}

export default function Callback() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <CallbackContent />
    </Suspense>
  );
}
