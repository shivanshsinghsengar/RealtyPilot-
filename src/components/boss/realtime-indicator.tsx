"use client";

import { useEffect, useState } from "react";
import { Circle } from "lucide-react";

export function RealtimeIndicator() {
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Simulate real-time connection check
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
      <Circle
        className={`h-2 w-2 fill-current ${
          isConnected ? "text-green-500 animate-pulse" : "text-gray-400"
        }`}
      />
      <span className="text-sm font-medium">
        {isConnected ? "Live" : "Offline"}
      </span>
      <span className="text-xs text-muted-foreground">
        Updated {lastUpdate.toLocaleTimeString()}
      </span>
    </div>
  );
}
