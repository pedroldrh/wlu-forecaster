"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { submitComment, deleteComment } from "@/actions/comments";
import { toast } from "sonner";
import { Trash, PaperPlaneTilt, ChatDots } from "@phosphor-icons/react";
import { UserAvatar } from "@/components/user-avatar";
import Link from "next/link";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile: {
    name: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface CommentSectionProps {
  questionId: string;
  comments: Comment[];
  currentUserId: string | null;
}

function timeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function CommentSection({ questionId, comments, currentUserId }: CommentSectionProps) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    startTransition(async () => {
      try {
        await submitComment(questionId, content);
        setContent("");
        toast.success("Comment posted");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to post comment");
      }
    });
  };

  const handleDelete = (commentId: string) => {
    startTransition(async () => {
      try {
        await deleteComment(commentId, questionId);
        toast.success("Comment deleted");
        router.refresh();
      } catch (error) {
        toast.error("Failed to delete comment");
      }
    });
  };

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Discussion{comments.length > 0 && (
          <span className="ml-1.5 text-foreground">{comments.length}</span>
        )}
      </h3>

      {currentUserId ? (
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your take..."
              maxLength={500}
              rows={1}
              className="w-full rounded-2xl border border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:bg-background resize-none min-h-[42px] max-h-32 transition-colors"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 128) + "px";
              }}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={isPending || !content.trim()}
            className="rounded-full h-[42px] w-[42px] shrink-0"
          >
            <PaperPlaneTilt className="h-4 w-4" weight="fill" />
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link href="/signin" className="text-primary hover:underline">Sign in</Link> to join the discussion.
        </p>
      )}

      {comments.length === 0 ? (
        <div className="text-center py-8">
          <div className="h-12 w-12 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-3">
            <ChatDots className="h-5 w-5 text-muted-foreground/30" />
          </div>
          <p className="text-sm text-muted-foreground">No comments yet</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Be the first to share your take</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const name = comment.profile?.display_name || comment.profile?.name || "Anonymous";
            const isOwn = comment.user_id === currentUserId;

            return (
              <div key={comment.id} className="flex gap-3 group">
                <UserAvatar
                  userId={comment.user_id}
                  size="sm"
                  className="shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{name}</span>
                    <span className="text-xs text-muted-foreground/50">{timeAgo(comment.created_at)}</span>
                    {isOwn && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        disabled={isPending}
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words mt-0.5 leading-relaxed">{comment.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
