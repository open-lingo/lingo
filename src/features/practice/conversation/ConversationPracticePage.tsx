/**
 * Conversation practice hub — the surface for both curated-dialogue modes:
 *  - LISTEN (comprehension): hear an authored dialogue, answer context
 *    questions, read the transcript with inline lookup.
 *  - ROLEPLAY (interactive): the app voices the other side; the learner
 *    produces the `learnerRole` speaker's lines (tiles → type → speak).
 *
 * The landing lists conversations unlocked at the learner's reached module
 * (`getConversations` gates `module <= reached`); picking a mode opens the
 * matching player. Languages / modules with no curated dialogue show an
 * encouraging empty state.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, EmptyState } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLang } from "@/shared/hooks/useLangPath";
import { getTtsLang } from "@/features/practice/data/practiceDataLoader";
import { getConversations, type Conversation } from "@/features/practice/content";
import { useCourseLevel } from "@/features/practice/useCourseLevel";
import { ConversationListener } from "./ConversationListener";
import { ConversationRoleplay } from "./ConversationRoleplay";

type ActiveMode = "listen" | "roleplay";

export function ConversationPracticePage() {
  const { t } = useTranslation();
  const langId = useLang();
  const ttsLang = getTtsLang(langId);
  const reachedModule = useCourseLevel();

  const conversations = useMemo(
    () => getConversations(langId, reachedModule),
    [langId, reachedModule],
  );

  const [active, setActive] = useState<{
    conv: Conversation;
    mode: ActiveMode;
  } | null>(null);

  const header = (
    <div>
      <h1 className="text-2xl font-bold text-text-primary">
        {t("practice.conversation.title", { defaultValue: "Conversations" })}
      </h1>
      <p className="text-sm text-text-secondary">
        {t("practice.conversation.subtitle", {
          defaultValue: "Listen to real dialogues, then talk back",
        })}
      </p>
    </div>
  );

  if (active) {
    return (
      <div className="space-y-4">
        {active.mode === "listen" ? (
          <ConversationListener
            conv={active.conv}
            lang={langId}
            defaultTtsLang={ttsLang}
            onExit={() => setActive(null)}
          />
        ) : (
          <ConversationRoleplay
            conv={active.conv}
            lang={langId}
            defaultTtsLang={ttsLang}
            onExit={() => setActive(null)}
          />
        )}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="space-y-4">
        {header}
        <EmptyState
          icon={<Icon name="messageCircle" size={28} aria-hidden />}
          title={t("practice.conversation.empty.title", {
            defaultValue: "No conversations yet",
          })}
          description={t("practice.conversation.empty.desc", {
            defaultValue:
              "Keep working through your lessons — dialogues unlock as you reach the modules they belong to.",
          })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {header}
      <div className="grid gap-3">
        {conversations.map((conv) => (
          <Card key={conv.id} padding="md">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-text-primary">
                    {conv.title}
                  </h2>
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-text-muted">
                    {t("practice.conversation.moduleTag", {
                      defaultValue: "M{{n}}",
                      n: conv.module,
                    })}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-text-secondary">
                  {conv.situation}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActive({ conv, mode: "listen" })}
                >
                  <Icon name="headphones" size={14} aria-hidden />
                  {t("practice.conversation.listen", { defaultValue: "Listen" })}
                </Button>
                {conv.learnerRole && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActive({ conv, mode: "roleplay" })}
                  >
                    <Icon name="mic" size={14} aria-hidden />
                    {t("practice.conversation.roleplay", {
                      defaultValue: "Roleplay",
                    })}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
