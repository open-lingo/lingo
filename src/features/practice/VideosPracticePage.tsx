import { useState, useRef, useEffect } from "react";
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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("practice.videosTitle")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose a learning language to see videos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("practice.videosTitle")}
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {t("practice.videosSubtitle", { language: languageName })}
        </p>
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">
          {t("practice.videosMockNote")}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-black dark:border-gray-700">
        {/* Video placeholder */}
        <div className="flex aspect-video items-center justify-center bg-gray-900">
          <div className="text-center text-gray-500">
            <span className="text-4xl" aria-hidden>🎬</span>
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
            {isPlaying ? "⏸" : "▶"}
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
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <h3 className="border-b border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 dark:border-gray-700 dark:text-white">
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
                  isActive ? "bg-green-50 dark:bg-green-900/20" : ""
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
                        className={`rounded px-1 py-0.5 text-left transition hover:bg-green-200 dark:hover:bg-green-800/50 ${
                          isAdded
                            ? "bg-green-200 text-green-800 dark:bg-green-800/50 dark:text-green-200"
                            : "hover:underline"
                        } ${justAdded ? "ring-1 ring-green-500" : ""}`}
                        title={t("practice.addToDeck")}
                      >
                        {word}
                      </button>
                      {justAdded && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          ✓ {t("practice.addedToDeck")}
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
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {addedWords.size} word(s) added to deck (mock — not persisted).
        </p>
      )}
    </div>
  );
}
