import { cn } from "@/lib/utils";

interface UserAvatarProps {
  userId: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  xs: "h-5 w-5",
  sm: "h-7 w-7",
  md: "h-8 w-8",
  lg: "h-16 w-16",
};

export function UserAvatar({ userId, size = "md", className }: UserAvatarProps) {
  return (
    <img
      src={`/api/avatar/${userId}`}
      alt=""
      className={cn("rounded-full", sizeClasses[size], className)}
    />
  );
}
