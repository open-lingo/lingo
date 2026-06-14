import { useState, useRef, useEffect } from "react";
import { Icon } from "@/shared/components/Icon";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { MOCK_VIDEO_KO } from "./videos/mockVideoData";
import type { TranscriptSegment } from "./videos/mockVideoData";

function getCurrentSegment(segments: TranscriptSegment[], currentTime: number): TranscriptSegment | null {
  return segments.find((s) => currentTime >= s.start && currentTime < s.end) ?? null;
}

export function VideosPracticePage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const langId = language?.id ?? "ko";
  const config = getLanguageConfig(langId);
  const languageName = config?.name ?? langId;

  const video = langId === "ko" ? MOCK_VIDEO_KO : MOCK_VIDEO_KO; // Reuse Korean mock for now
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const currentSegment = getCurrentSegment(video.transcript, currentTime);

  useEffect(() => {
    if (!isPlaying) return;
    const step = 0.5;
    const id = setInterval(() => {
      setCurrentTime((t) => {
        const next = t + step;
        if (next >= video.duration) {
          setIsPlaying(false);
          return video.duration;
        }
        return next;
      });
    }, step * 1000);
    return () => clearInterval(id);
  }, [isPlaying, video.duration]);

  useEffect(() => {
    if (currentSegment && transcriptRef.current) {
      const el = segmentRefs.current.get(currentSegment.id);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentSegment?.id]);

  useEffect(() => {
    if (lastAdded) {
      const id = setTimeout(() => setLastAdded(null), 1500);
      return () => clearTimeout(id);
    }
  }, [lastAdded]);

  function handleAddWord(word: string) {
    setAddedWords((prev) => new Set(prev).add(word));
    setLastAdded(word);
  }

  if (!language) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("practice.videosTitle")}
        </h2>
        <p className="text-text-muted">
          Choose a learning language to see videos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">
          {t("practice.videosTitle")}
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          {t("practice.videosSubtitle", { language: languageName })}
        </p>
        <p className="mt-2 text-xs text-amber-600">
          {t("practice.videosMockNote")}
        </p>
      </div>

      {/* Intentional raw grays: video-player chrome stays dark in every theme
          (like real video controls), so it must not follow surface tokens. */}
      <div className="overflow-hidden rounded-xl border border-border bg-black">
        {/* Video placeholder */}
        <div className="flex aspect-video items-center justify-center bg-gray-900">
          <div className="text-center text-gray-500">
            <Icon name="video" size={48} className="text-text-muted" />
            <p className="mt-2 text-sm">Video placeholder</p>
            <p className="text-xs">{video.title}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 border-t border-gray-700 bg-gray-800/50 px-4 py-2">
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="rounded-full bg-white/20 p-2 text-white transition hover:bg-white/30"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Icon name="pause" size={20} /> : <Icon name="play" size={20} />}
          </button>
          <input
            type="range"
            min={0}
            max={video.duration}
            step={0.1}
            value={currentTime}
            onChange={(e) => setCurrentTime(Number(e.target.value))}
            className="flex-1 accent-green-500"
          />
          <span className="text-xs text-gray-400">
            {Math.floor(currentTime)}s / {video.duration}s
          </span>
        </div>
      </div>

      {/* Rolling transcript */}
      <div className="rounded-xl border border-border bg-surface">
        <h3 className="border-b border-border px-4 py-3 text-sm font-medium text-text-primary">
          Transcript
        </h3>
        <div
          ref={transcriptRef}
          className="max-h-64 overflow-y-auto px-4 py-3"
        >
          {video.transcript.map((segment) => {
            const isActive = currentSegment?.id === segment.id;
            return (
              <div
                key={segment.id}
                ref={(el) => {
                  if (el) segmentRefs.current.set(segment.id, el);
                }}
                className={`flex flex-wrap gap-1 py-1.5 ${
                  isActive ? "bg-green-50" : ""
                }`}
                style={{ scrollMargin: "1rem" }}
              >
                {segment.words.map((word) => {
                  const isAdded = addedWords.has(word);
                  const justAdded = lastAdded === word;
                  return (
                    <span key={word} className="inline-flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleAddWord(word)}
                        className={`rounded px-1 py-0.5 text-left transition hover:bg-green-200 ${
                          isAdded
                            ? "bg-green-200 text-green-800"
                            : "hover:underline"
                        } ${justAdded ? "ring-1 ring-green-500" : ""}`}
                        title={t("practice.addToDeck")}
                      >
                        {word}
                      </button>
                      {justAdded && (
                        <span className="inline-flex items-center gap-1 text-xs text-accent">
                          <Icon name="check" size={12} /> {t("practice.addedToDeck")}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {addedWords.size > 0 && (
        <p className="text-sm text-text-muted">
          {addedWords.size} word(s) added to deck (mock — not persisted).
        </p>
      )}
    </div>
  );
}
