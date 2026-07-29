"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

export function CameraPlayer({
  streamUrl,
  streamType,
  name,
}: {
  streamUrl: string;
  streamType: "IFRAME" | "HLS";
  name: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (streamType !== "HLS") return;
    const video = videoRef.current;
    if (!video) return;

    setError(false);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      return;
    }

    let hls: import("hls.js").default | undefined;
    let cancelled = false;

    import("hls.js").then(({ default: Hls }) => {
      if (cancelled) return;
      if (!Hls.isSupported()) {
        setError(true);
        return;
      }
      hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) setError(true);
      });
    });

    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [streamUrl, streamType]);

  if (streamType === "IFRAME") {
    return (
      <iframe
        src={streamUrl}
        title={name}
        allow="autoplay; fullscreen"
        className="size-full border-0"
      />
    );
  }

  if (error) {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
        <AlertTriangle className="size-6" />
        <p className="text-xs">Stream tidak dapat dimuat.</p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      controls
      className="size-full bg-black object-contain"
    />
  );
}
