import { cn } from "@/lib/utils";

interface UserAvatarProps {
  avatarUrl?: string | null;
  userId: string;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  xs: "h-5 w-5",
  sm: "h-7 w-7",
  md: "h-8 w-8",
  lg: "h-16 w-16",
};

export function UserAvatar({ avatarUrl, userId, size = "md", className }: UserAvatarProps) {
  const src = avatarUrl || `/api/avatar/${userId}`;
  return (
    <img
      src={src}
      alt=""
      className={cn("rounded-full", sizeClasses[size], className)}
    />
  );
}
