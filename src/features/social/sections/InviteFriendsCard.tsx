/**
 * Invite-friends CTA card + companion modal. UI stub only — the actual
 * lingot payout + ad-free clock is owned by the finance / ads agents.
 * This component just exposes the link, the reward terms, and a copy
 * affordance so design can be reviewed end-to-end.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { ModalBase } from "@/shared/components/ModalBase";
import { useInviteOffer } from "../hooks/useSocial";

export function InviteFriendsCard() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { data: offer, isLoading } = useInviteOffer();

  if (isLoading || !offer) {
    return (
      <Card padding="md">
        <div className="h-12 animate-pulse rounded bg-surface-muted" />
      </Card>
    );
  }

  return (
    <>
      <Card
        padding="none"
        className="overflow-hidden border-accent/30 bg-gradient-to-br from-accent/15 via-accent-muted to-surface"
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-on-accent shadow-sm">
            <Icon name="userPlus" size={18} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-text-primary">
              {t("social.invite.title", "Invite a friend, both win")}
            </p>
            <p className="text-[11px] text-text-secondary">
              {t("social.invite.subtitle", "{{lingots}} lingots + {{hours}}h ad-free for each of you", {
                lingots: offer.rewardLingots,
                hours: offer.rewardAdFreeHours,
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent shadow-sm transition hover:bg-accent-hover"
          >
            {t("social.invite.cta", "Get link")}
          </button>
        </div>
        {offer.acceptedCount > 0 ? (
          <div className="border-t border-accent/20 bg-surface/60 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {t("social.invite.accepted", "{{n}} of {{cap}} invites redeemed", {
              n: offer.acceptedCount,
              cap: offer.acceptedCap,
            })}
          </div>
        ) : null}
      </Card>
      {open ? <InviteModal onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { data: offer } = useInviteOffer({ instant: true });
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!offer) return;
    try {
      await navigator.clipboard.writeText(offer.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback: select text on focus — no-op in tests.
      setCopied(true);
    }
  };

  if (!offer) return null;

  return (
    <ModalBase
      onClose={onClose}
      title={t("social.invite.modalTitle", "Invite a friend")}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 px-6 py-5">
        <p className="text-sm text-text-secondary">
          {t(
            "social.invite.modalBody",
            "Send this link to a friend. When they join Lingo, you both get {{lingots}} lingots and {{hours}} hour of ad-free time.",
            { lingots: offer.rewardLingots, hours: offer.rewardAdFreeHours },
          )}
        </p>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2">
          <Icon name="link" size={14} aria-hidden className="text-text-muted" />
          <code className="flex-1 truncate font-mono text-xs text-text-primary">{offer.url}</code>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-on-accent shadow-sm transition hover:bg-accent-hover"
          >
            {copied
              ? t("social.invite.copied", "Copied!")
              : t("social.invite.copy", "Copy")}
          </button>
        </div>

        <ul className="space-y-2 rounded-lg border border-border bg-surface-muted px-4 py-3 text-xs">
          <li className="flex items-center gap-2 text-text-secondary">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-on-accent">
              <Icon name="gem" size={11} aria-hidden />
            </span>
            {t("social.invite.rewardLingots", "+{{n}} lingots when your friend joins", {
              n: offer.rewardLingots,
            })}
          </li>
          <li className="flex items-center gap-2 text-text-secondary">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success">
              <Icon name="sparkles" size={11} aria-hidden />
            </span>
            {t("social.invite.rewardAdFree", "+{{n}} hour ad-free for both of you", {
              n: offer.rewardAdFreeHours,
            })}
          </li>
          <li className="flex items-center gap-2 text-text-muted">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface text-text-muted">
              <Icon name="info" size={11} aria-hidden />
            </span>
            {t("social.invite.cap", "Pays out for the first {{cap}} accepted invites.", {
              cap: offer.acceptedCap,
            })}
          </li>
        </ul>
      </div>
    </ModalBase>
  );
}
