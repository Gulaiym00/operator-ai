"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { setAccessToken } from "@/lib/auth";
import { PROFILE_QUERY_KEY } from "@/hooks/auth/useAuth";

function GoogleSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    if (accessToken) {
      setAccessToken(accessToken);
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      router.push("/");
    } else {
      router.push("/login?error=google_auth_failed");
    }
  }, [searchParams, router, queryClient]);

  return <div>Google login...</div>;
}

export default function GoogleSuccess() {
  return (
    <Suspense fallback={<div>Google login...</div>}>
      <GoogleSuccessContent />
    </Suspense>
  );
}
