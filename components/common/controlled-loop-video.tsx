"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

export function ControlledLoopVideo({
  src,
  ariaLabel,
  className,
  videoClassName
}: {
  src: string;
  ariaLabel: string;
  className?: string;
  videoClassName?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const keepPlaying = () => {
      void video.play().catch(() => undefined);
    };
    const resumeWhenVisible = () => {
      if (!document.hidden) keepPlaying();
    };

    keepPlaying();
    video.addEventListener("canplay", keepPlaying);
    video.addEventListener("pause", keepPlaying);
    document.addEventListener("visibilitychange", resumeWhenVisible);

    return () => {
      video.removeEventListener("canplay", keepPlaying);
      video.removeEventListener("pause", keepPlaying);
      document.removeEventListener("visibilitychange", resumeWhenVisible);
    };
  }, []);

  async function toggleMuted() {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setMuted(nextMuted);

    try {
      await video.play();
    } catch {
      video.muted = true;
      setMuted(true);
      await video.play().catch(() => undefined);
    }
  }

  return (
    <div className={cn("relative", className)} data-testid="controlled-loop-video">
      <video
        ref={videoRef}
        className={cn("pointer-events-none block", videoClassName)}
        src={src}
        aria-label={ariaLabel}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        controls={false}
        controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
        disablePictureInPicture
        disableRemotePlayback
        tabIndex={-1}
      >
        Your browser does not support the video tag.
      </video>
      <button
        type="button"
        onClick={() => void toggleMuted()}
        aria-label={muted ? "Unmute video" : "Mute video"}
        aria-pressed={!muted}
        className="absolute bottom-3 right-3 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/65 text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:border-primary/50 hover:bg-black/80 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        data-testid="video-mute-toggle"
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
