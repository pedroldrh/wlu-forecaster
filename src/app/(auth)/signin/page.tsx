"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { BarChart3 } from "lucide-react";
import { toast } from "sonner";

const WORDS_TOP = ["sports", "campus", "greek life"];
const WORDS_BOTTOM = ["dining", "weather", "academics"];
const ALL_WORDS = [...WORDS_TOP, ...WORDS_BOTTOM];

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const [spotlight, setSpotlight] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const interval = setInterval(() => {
      setSpotlight((prev) => (prev + 1) % ALL_WORDS.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  async function handleSignIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  }

  function wordClass(globalIndex: number) {
    const isActive = spotlight === globalIndex;
    return `text-2xl sm:text-3xl font-semibold select-none transition-all duration-500 ${
      isActive
        ? "text-white scale-110 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]"
        : "text-white/30"
    }`;
  }

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] md:min-h-[calc(100vh-5rem)] bg-gradient-to-b from-blue-600 via-indigo-600 to-blue-700 flex flex-col items-center overflow-hidden">
      {/* Brand */}
      <div className="animate-hero-fade-in flex items-center gap-2.5 pt-10 sm:pt-14 pb-4 z-10">
        <BarChart3 className="h-7 w-7 text-white/90" />
        <span className="text-xl font-bold text-white/90 tracking-tight">
          Forecaster
        </span>
      </div>

      {/* Floating words — top */}
      <div className="flex flex-col items-center gap-2 z-10 mt-4 sm:mt-8">
        {WORDS_TOP.map((word, i) => (
          <span key={word} className={wordClass(i)}>
            {word}
          </span>
        ))}
      </div>

      {/* Hero text */}
      <h1
        className="animate-hero-fade-in text-4xl sm:text-5xl md:text-6xl font-extrabold text-white text-center px-6 my-6 sm:my-8 z-10"
        style={{ animationDelay: "0.2s" }}
      >
        Forecast anything
      </h1>

      {/* Floating words — bottom */}
      <div className="flex flex-col items-center gap-2 z-10">
        {WORDS_BOTTOM.map((word, i) => (
          <span key={word} className={wordClass(i + WORDS_TOP.length)}>
            {word}
          </span>
        ))}
      </div>

      {/* Sign in section — centered between words and bottom */}
      <div className="flex-1 flex items-center w-full max-w-sm mx-auto px-6 z-10">
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold text-base rounded-full py-3.5 px-6 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {loading ? "Redirecting..." : "Continue with Google"}
        </button>
      </div>

      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
