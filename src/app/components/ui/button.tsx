import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base Y2K styles with classic outset border and retro aesthetics
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none relative overflow-hidden cursor-pointer select-none active:scale-95 transform-gpu",
  {
    variants: {
      variant: {
        // Classic Windows button with beveled edges
        default: [
          "bg-gradient-to-b from-base-200 via-base-100 to-base-300",
          "border-2 border-base-400",
          "text-base-800",
          "shadow-[inset_1px_1px_0px_rgba(255,255,255,0.8),inset_-1px_-1px_0px_rgba(0,0,0,0.3)]",
          "hover:from-base-300 hover:via-base-200 hover:to-base-400",
          "active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]",
          "active:from-base-300 active:to-base-200",
        ],

        // Neon cyber button
        cyber: [
          "bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600",
          "border-2 border-cyan-300",
          "text-white font-black",
          "shadow-[0_0_10px_rgba(0,255,255,0.5),inset_1px_1px_0px_rgba(255,255,255,0.3)]",
          "hover:shadow-[0_0_20px_rgba(0,255,255,0.8),inset_1px_1px_0px_rgba(255,255,255,0.3)]",
          "hover:from-cyan-300 hover:via-blue-400 hover:to-purple-500",
          "active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]",
        ],

        // Hot pink Y2K style
        retro: [
          "bg-gradient-to-b from-pink-300 via-pink-400 to-pink-600",
          "border-2 border-pink-200",
          "text-white font-black",
          "shadow-[inset_1px_1px_0px_rgba(255,255,255,0.6),inset_-1px_-1px_0px_rgba(0,0,0,0.3)]",
          "hover:from-pink-200 hover:via-pink-300 hover:to-pink-500",
          "hover:shadow-[0_0_15px_rgba(255,20,147,0.6)]",
          "active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]",
        ],

        // Matrix green
        matrix: [
          "bg-gradient-to-b from-green-300 via-green-400 to-green-600",
          "border-2 border-green-200",
          "text-black font-black",
          "shadow-[inset_1px_1px_0px_rgba(255,255,255,0.6),0_0_10px_rgba(0,255,0,0.3)]",
          "hover:from-green-200 hover:via-green-300 hover:to-green-500",
          "hover:shadow-[0_0_20px_rgba(0,255,0,0.6)]",
          "active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]",
        ],

        // Holographic button
        holo: [
          "bg-gradient-to-r from-purple-400 via-pink-400 via-yellow-400 via-cyan-400 to-purple-400",
          "bg-size-200 animate-gradient",
          "border-2 border-white",
          "text-white font-black",
          "shadow-[inset_1px_1px_0px_rgba(255,255,255,0.4),0_0_15px_rgba(255,255,255,0.3)]",
          "hover:shadow-[0_0_25px_rgba(255,255,255,0.6)]",
          "hover:animate-pulse",
          "active:scale-95",
        ],

        // Glitch destructive
        destructive: [
          "bg-gradient-to-b from-red-400 via-red-500 to-red-700",
          "border-2 border-red-300",
          "text-white font-black",
          "shadow-[inset_1px_1px_0px_rgba(255,255,255,0.3),0_0_10px_rgba(255,0,0,0.4)]",
          "hover:shadow-[0_0_20px_rgba(255,0,0,0.7)]",
          "hover:from-red-300 hover:via-red-400 hover:to-red-600",
          "active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]",
        ],

        // Transparent glass
        glass: [
          "bg-gradient-to-b from-white/30 to-white/10",
          "border-2 border-white/40",
          "text-base-800 font-bold",
          "backdrop-blur-sm",
          "shadow-[inset_1px_1px_0px_rgba(255,255,255,0.6)]",
          "hover:from-white/40 hover:to-white/20",
          "hover:border-white/60",
          "active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)]",
        ],

        // Chrome metallic
        chrome: [
          "bg-gradient-to-b from-base-300 via-base-400 via-base-200 to-base-500",
          "border-2 border-base-400",
          "text-base-800 font-black",
          "shadow-[inset_1px_1px_0px_rgba(255,255,255,0.8),inset_-1px_-1px_0px_rgba(0,0,0,0.3)]",
          "hover:from-base-200 hover:via-base-300 hover:via-base-100 hover:to-base-400",
          "active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]",
        ],
      },
      size: {
        sm: "h-7 px-3 py-1 text-xs",
        default: "h-9 px-4 py-2",
        lg: "h-12 px-6 py-3 text-base",
        xl: "h-14 px-8 py-4 text-lg",
        icon: "size-9 p-0",
      },
      effect: {
        none: "",
        glow: "hover:drop-shadow-[0_0_10px_currentColor]",
        pulse: "animate-pulse",
        bounce: "hover:animate-bounce",
        shake: "hover:animate-shake",
        rainbow: "animate-rainbow-bg",
        scan: "relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-1000",
      },
    },
    defaultVariants: {
      variant: "chrome",
      size: "default",
      effect: "scan",
    },
  }
);

// Add custom CSS for animations (you'd put this in your global CSS)
const y2kStyles = `
@keyframes gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes rainbow-bg {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

.animate-gradient {
  animation: gradient 3s ease infinite;
}

.animate-rainbow-bg {
  animation: rainbow-bg 2s linear infinite;
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

.bg-size-200 {
  background-size: 200% 200%;
}
`;

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    glitch?: boolean;
    scanline?: boolean;
  };

function Button({
  className,
  variant,
  size,
  effect,
  asChild = false,
  glitch = false,
  scanline = false,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  const [isPressed, setIsPressed] = React.useState(false);

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: y2kStyles }} />
      <Comp
        data-slot="button"
        className={cn(
          buttonVariants({ variant, size, effect }),
          {
            "animate-pulse": glitch,
            "relative overflow-hidden": scanline,
          },
          className
        )}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isPressed ? "scale(0.95)" : "scale(1)",
          transition: "transform 0.1s ease",
        }}
        {...props}
      >
        {scanline && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
        )}

        {glitch && (
          <>
            <span className="absolute inset-0 bg-red-500 opacity-0 animate-pulse mix-blend-multiply" />
            <span
              className="absolute inset-0 bg-cyan-500 opacity-0 animate-pulse mix-blend-multiply"
              style={{ animationDelay: "0.1s" }}
            />
          </>
        )}

        <span className="relative z-10 drop-shadow-sm">{children}</span>

        {/* Shine effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none" />
      </Comp>
    </>
  );
}

export { Button, buttonVariants };
