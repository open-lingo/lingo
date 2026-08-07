/**
 * What KIND of reading item is open — a story or a conversation.
 *
 * The breadcrumb leaf has to say one or the other, but both live at
 * `practice/stories/:storyId`: the id itself is the discriminator (see
 * `ReadingRoute`), so only something that has resolved it against the content
 * knows which it is. The breadcrumbs cannot resolve it themselves —
 * `PracticeLayout` imports them EAGERLY, so an `allConversations` import there
 * would drag the whole authored corpus (~380KB) into the main bundle to label
 * one crumb.
 *
 * So the route publishes and the crumb reads. The provider sits in
 * `PracticeLayout`, above both the breadcrumbs and the outlet; the content
 * modules stay where they already are, behind the lazy `ReadingRoute` chunk.
 *
 * Published from a LAYOUT effect, not a passive one: React flushes layout
 * effects and the re-render they schedule before the browser paints, so a
 * conversation never shows a frame labelled "Story" on its way to the right
 * label.
 */
import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ReadingItemKind = "story" | "conversation";

interface ReadingCrumbValue {
  kind: ReadingItemKind | null;
  publish: (kind: ReadingItemKind | null) => void;
}

const ReadingCrumbContext = createContext<ReadingCrumbValue | null>(null);

export function ReadingCrumbProvider({ children }: { children: ReactNode }) {
  const [kind, setKind] = useState<ReadingItemKind | null>(null);
  const value = useMemo<ReadingCrumbValue>(() => ({ kind, publish: setKind }), [kind]);
  return (
    <ReadingCrumbContext.Provider value={value}>{children}</ReadingCrumbContext.Provider>
  );
}

/** `null` when no reader is open — or when the reader hasn't published yet. */
export function useReadingItemKind(): ReadingItemKind | null {
  return useContext(ReadingCrumbContext)?.kind ?? null;
}

/**
 * Publish `kind` for as long as the caller is mounted, and clear it on the way
 * out so a stale label never outlives the reader that set it. A no-op outside
 * a provider, which is what lets a reader be rendered on its own in a test.
 */
export function usePublishReadingItemKind(kind: ReadingItemKind): void {
  const publish = useContext(ReadingCrumbContext)?.publish;
  useLayoutEffect(() => {
    if (!publish) return;
    publish(kind);
    return () => publish(null);
  }, [publish, kind]);
}
