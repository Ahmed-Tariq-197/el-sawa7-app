import { Bus } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const Logo = ({ size = "md", showText = true, className = "" }: LogoProps) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
  };

  const textSizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-lg bg-primary flex items-center justify-center shadow-soft`}>
        <Bus className="h-2/3 w-2/3 text-primary-foreground" />
      </div>
      {showText && (
        <span className={`${textSizes[size]} font-bold text-foreground`}>
          ElSawa<span className="text-accent">7</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
