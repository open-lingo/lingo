/**
 * App-wide "audio never outlives the screen that started it".
 *
 * `stopAllAudio` has existed for a while, but only `LessonPage` and
 * `PlacementTestPage` ever called it — and they call it on their own internal
 * transitions (step advance, session end), not on navigation. Every other
 * audible surface (dialogue-listen steps, the conversation listener and
 * roleplay, the listening / speaking practice pages, the story and
 * conversation readers) left its clip playing over whatever the learner
 * navigated to next. Reported by Spencer.
 *
 * Fixing that per surface is eight cleanups that the ninth surface forgets, so
 * the stop lives here and is mounted once in the app shell. The sequencer
 * surfaces already abort their own loops on unmount (session-id / `stillCurrent`
 * guards), so cutting the in-flight clip is all the shell has to do.
 */
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { stopAllAudio } from "@/shared/tts";

export function useStopAudioOnNavigate(): void {
  const { pathname } = useLocation();
  // The path this hook has already settled on, seeded from the FIRST render.
  // The dependency array alone would keep a same-path re-render quiet, but not
  // a mount — and mounts matter: a StrictMode double-invoke in dev, or the
  // shell mounting straight into a lesson, would fire a stop into a screen
  // whose own autoplay is already queued and cut it off mid-word.
  const settled = useRef(pathname);

  useEffect(() => {
    if (settled.current === pathname) return;
    settled.current = pathname;
    stopAllAudio();
  }, [pathname]);

  // Deliberately NOT wired to `visibilitychange`. Hidden tabs keep Web Audio
  // running, so a stop there is desirable in principle — but stopping a clip
  // resolves the `playJaAudioToEnd` promise its sequencer is awaiting, and a
  // sequencer that is still mounted just advances to the next line and plays
  // it. Tab-hide would therefore SKIP a line rather than stop the dialogue,
  // and the learner would come back to content that played to an empty room.
  // Navigation does not have that problem: unmount cancels the loops first.
}
