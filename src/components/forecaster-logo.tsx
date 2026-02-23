import type { SVGProps } from "react";

export function ForecasterLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <rect x="3" y="14" width="4" height="7" rx="2" />
      <rect x="10" y="8" width="4" height="13" rx="2" />
      <rect x="17" y="3" width="4" height="18" rx="2" />
    </svg>
  );
}
