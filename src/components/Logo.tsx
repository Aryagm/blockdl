interface LogoProps {
  className?: string;
  variant?: "default" | "favicon";
}

export function Logo({
  className = "h-8 w-8",
  variant = "default",
}: LogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="10"
        y="10"
        width="80"
        height="80"
        rx="15"
        stroke="currentColor"
        strokeWidth="5"
        fill={variant === "favicon" ? "white" : "none"}
      />
      <circle cx="50" cy="30" r="8" fill="currentColor" />
      <circle cx="30" cy="50" r="8" fill="currentColor" />
      <circle cx="70" cy="50" r="8" fill="currentColor" />
      <circle cx="50" cy="70" r="8" fill="currentColor" />
      <line
        x1="50"
        y1="30"
        x2="30"
        y2="50"
        stroke="currentColor"
        strokeWidth="3"
      />
      <line
        x1="50"
        y1="30"
        x2="70"
        y2="50"
        stroke="currentColor"
        strokeWidth="3"
      />
      <line
        x1="30"
        y1="50"
        x2="50"
        y2="70"
        stroke="currentColor"
        strokeWidth="3"
      />
      <line
        x1="70"
        y1="50"
        x2="50"
        y2="70"
        stroke="currentColor"
        strokeWidth="3"
      />
    </svg>
  );
}
