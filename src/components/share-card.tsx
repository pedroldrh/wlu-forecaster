"use client";

import { useState } from "react";
import { X, ShareNetwork, Check, Fire } from "@phosphor-icons/react";
import { getQuestionEmoji } from "@/lib/constants";

interface ShareCardProps {
  questionTitle: string;
  category: string;
  outcome: boolean;
  userVotedYes: boolean;
  correct: boolean;
  yesPct: number | null;
  totalVotes: number;
  displayName: string;
  questionId: string;
}

export function ShareCardButton(props: ShareCardProps) {
  const [open, setOpen] = useState(false);

  if (!props.correct) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-400 hover:bg-green-500/15 active:scale-[0.96] transition-all"
      >
        <ShareNetwork className="h-4 w-4" />
        Share Win
      </button>

      {open && (
        <ShareCardOverlay {...props} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function ShareCardOverlay(props: ShareCardProps & { onClose: () => void }) {
  const {
    questionTitle, category, outcome, userVotedYes, correct,
    yesPct, totalVotes, displayName, questionId, onClose,
  } = props;
  const [copied, setCopied] = useState(false);

  const emoji = getQuestionEmoji(questionTitle, category);
  const majorityWrong = yesPct !== null && (
    (outcome && yesPct < 50) || (!outcome && yesPct >= 50)
  );

  const shareUrl = `https://wluforcaster.com/questions/${questionId}`;
  const shareText = `I called it — "${questionTitle}" resolved ${outcome ? "YES" : "NO"}. Play on Forecaster!`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Forecaster", text: shareText, url: shareUrl });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    } catch {
      const input = document.createElement("input");
      input.value = `${shareText} ${shareUrl}`;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center px-5"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-[max(env(safe-area-inset-top,16px),16px)] right-4 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white active:scale-[0.85] transition-all z-10"
      >
        <X className="h-5 w-5" />
      </button>

      {/* The card — designed to look great as a screenshot */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl overflow-hidden animate-[scale-in_300ms_ease-out]"
        style={{
          background: correct
            ? "linear-gradient(145deg, #064e3b 0%, #0c1a12 50%, #0a0a0a 100%)"
            : "linear-gradient(145deg, #7f1d1d 0%, #1a0c0c 50%, #0a0a0a 100%)",
        }}
      >
        <div className="px-6 pt-8 pb-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-lg">
                {emoji}
              </div>
              <span className="text-sm font-bold text-white/60 uppercase tracking-wider">
                {category}
              </span>
            </div>
            {majorityWrong && (
              <span className="text-xs font-bold text-amber-400 bg-amber-400/10 rounded-full px-2.5 py-1">
                Against the crowd
              </span>
            )}
          </div>

          {/* Question */}
          <h2 className="text-xl font-bold text-white leading-snug">
            {questionTitle}
          </h2>

          {/* Result */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-lg font-black ${
                outcome ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
              }`}>
                {outcome ? "Y" : "N"}
              </div>
              <div>
                <p className="text-lg font-bold text-white">
                  Resolved {outcome ? "YES" : "NO"}
                </p>
                <p className="text-sm text-white/40">
                  {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                  {yesPct !== null && ` · ${yesPct}% said YES`}
                </p>
              </div>
            </div>

            {/* User's call */}
            <div className="rounded-2xl bg-white/[0.06] px-4 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-0.5">
                  {displayName}
                </p>
                <p className="text-white font-bold">
                  Called {userVotedYes ? "YES" : "NO"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-green-500/15 rounded-full px-3 py-1.5">
                <Check className="h-4 w-4 text-green-400" weight="bold" />
                <span className="text-sm font-bold text-green-400">Nailed it</span>
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Fire className="h-4 w-4 text-orange-400" weight="fill" />
              <span className="text-xs font-bold text-white/30 uppercase tracking-widest">
                Forecaster
              </span>
            </div>
            <span className="text-xs text-white/20">wluforcaster.com</span>
          </div>
        </div>
      </div>

      {/* Actions below card */}
      <div className="mt-6 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black active:scale-[0.93] transition-all"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" weight="bold" />
              Copied!
            </>
          ) : (
            <>
              <ShareNetwork className="h-4 w-4" weight="bold" />
              Share
            </>
          )}
        </button>
        <p className="text-xs text-white/30">or screenshot this card</p>
      </div>
    </div>
  );
}
