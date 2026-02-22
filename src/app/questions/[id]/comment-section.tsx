"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { submitComment, deleteComment } from "@/actions/comments";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    startTransition(async () => {
      try {
        await submitComment(questionId, content);
        setContent("");
        toast.success("Comment posted");
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
      } catch (error) {
        toast.error("Failed to delete comment");
      }
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">
        Comments {comments.length > 0 && <span className="text-muted-foreground font-normal text-sm">({comments.length})</span>}
      </h3>

      {currentUserId ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts..."
            maxLength={500}
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{content.length}/500</span>
            <Button type="submit" size="sm" disabled={isPending || !content.trim()}>
              {isPending ? "Posting..." : "Post"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">Sign in to comment.</p>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No comments yet. Be the first to share your take.</p>
      ) : (
        <div className="space-y-3">
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
                    <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
                    {isOwn && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        disabled={isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{comment.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
