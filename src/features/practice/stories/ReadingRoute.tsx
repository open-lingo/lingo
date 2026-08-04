/**
 * `practice/stories/:storyId` — one route for everything in the reading
 * library, whether it was authored as a story or as a conversation.
 *
 * Conversations used to live at `practice/stories/c/:conversationId`. The `c`
 * segment existed to keep a conversation id from ever being read as a story
 * id, but it is not a page: it rendered as a breadcrumb the learner could
 * click, which went nowhere. The collision it guarded against does not exist —
 * ids are namespaced by language and module (`ko-m3-meeting` vs
 * `ko-m3-new-friend`) and there is not a single duplicate across the 145
 * stories and 34 conversations in the two shipped languages.
 *
 * So the id itself is the discriminator: resolve it against the stories, then
 * against the conversations, and render the matching reader. An id that
 * matches neither falls through to the story reader, which already owns the
 * graceful "we couldn't find that" state.
 *
 * Both readers are imported directly rather than lazily: this module is itself
 * a lazy route, and a learner arriving here is opening ONE item — a second
 * suspense boundary would only trade a smaller chunk for a second spinner.
 */
import { useParams } from "react-router-dom";
import { useLang } from "@/shared/hooks/useLangPath";
import { allConversations, allStories } from "@/features/practice/content";
import { StoryReaderPage } from "./StoryReaderPage";
import { ConversationReaderPage } from "./ConversationReaderPage";

export function ReadingRoute() {
  const { storyId } = useParams<{ storyId: string }>();
  const langId = useLang();
  const id = storyId ?? "";

  if (allStories(langId).some((s) => s.id === id)) {
    return <StoryReaderPage storyId={id} />;
  }
  if (allConversations(langId).some((c) => c.id === id)) {
    return <ConversationReaderPage conversationId={id} />;
  }
  return <StoryReaderPage storyId={id} />;
}
