"use client";

import { useState, useRef, useEffect } from "react";

interface HelpTipProps {
  text: string;
  position?: "top" | "bottom" | "left" | "right";
}

export function HelpTip({ text, position = "top" }: HelpTipProps) {
  const [open, setOpen] = useState(false);
  const tipRef = useRef<HTMLDivElement>(null);

  // Close on outside tap (mobile)
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (tipRef.current && !tipRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const positionClasses: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div ref={tipRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-label="Help"
        className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center cursor-help flex-shrink-0"
      >
        ?
      </button>
      {open && (
        <div
          className={`absolute z-50 w-56 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg ${positionClasses[position]}`}
        >
          {text}
        </div>
      )}
    </div>
  );
}
