import { PopcornIcon } from "@phosphor-icons/react";

type LogoSize = "small" | "medium" | "large";

interface LogoProps {
  size?: LogoSize;
}

export default function Logo({ size = "large" }: LogoProps) {
  const sizeClasses = {
    small: "text-lg gap-1",
    medium: "text-2xl gap-1.5",
    large: "text-5xl gap-2 sm:text-[5rem]",
  };

  const iconSizes = {
    small: 16,
    medium: 24,
    large: undefined,
  };

  return (
    <h1
      className={`flex items-center font-extrabold tracking-tight ${sizeClasses[size]}`}
    >
      Watch{" "}
      <span className="text-primary">
        <PopcornIcon color="#e97d21" size={iconSizes[size]} />
      </span>{" "}
      Lists
    </h1>
  );
}
