import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useToast } from "@/shared/contexts/ToastContext";
import { Icon } from "@/shared/components/Icon";
import { TabList, TabButton } from "@/shared/components/ui/Tabs";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { Button } from "@/shared/components/ui/Button";
import { LearningTab } from "./lms/LearningTab";
import { ImpersonateConfirmModal } from "./impersonation/ImpersonateConfirmModal";
import { ProfileTab } from "./user-detail/ProfileTab";
import { SubscriptionsTab } from "./user-detail/SubscriptionsTab";
import { ContentTab } from "./user-detail/ContentTab";
import { SrsTab } from "./user-detail/SrsTab";
import { SocialTab } from "./user-detail/SocialTab";
import { AwardXpModal } from "./user-detail/AwardXpModal";
import {
  useAdminUser,
  useAdminUserSubscriptions,
  useAdminUserContent,
  useAwardXp,
  useDeleteUser,
  useStartImpersonation,
} from "./user-detail/useAdminUserDetail";

type TabId = "profile" | "learning" | "subscriptions" | "content" | "srs" | "social";

const TAB_IDS: readonly TabId[] = [
  "profile",
  "learning",
  "subscriptions",
  "content",
  "srs",
  "social",
] as const;

const isTabId = (v: string | null): v is TabId =>
  v !== null && (TAB_IDS as readonly string[]).includes(v);

export function AdminUserDetailPage() {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const langPath = useLangPath();
  const showToast = useToast().showToast;

  const userQ = useAdminUser(userId);
  const subsQ = useAdminUserSubscriptions(userId);
  const contentQ = useAdminUserContent(userId);

  // Tab state is URL-driven so external links (e.g. UserPicker on the
  // Learning config page) can deep-link to /admin/users/:id?tab=learning.
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TabId = isTabId(tabParam) ? tabParam : "profile";
  const setActiveTab = (tab: TabId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === "profile") next.delete("tab");
      else next.set("tab", tab);
      return next;
    });
  };

  // Header-level modals + their state.
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [awardXpOpen, setAwardXpOpen] = useState(false);
  const [awardXpAmount, setAwardXpAmount] = useState("100");
  const [awardXpReason, setAwardXpReason] = useState("");
  const [impersonateOpen, setImpersonateOpen] = useState(false);

  const awardXp = useAwardXp(userId ?? "");
  const deleteUser = useDeleteUser(userId ?? "");
  const impersonate = useStartImpersonation(userId ?? "");

  const handleAwardXp = () => {
    const parsed = Number(awardXpAmount);
    if (!Number.isFinite(parsed) || Math.floor(parsed) === 0) {
      showToast(t("admin.awardXp.invalidAmount", "Enter a non-zero amount"), "error");
      return;
    }
    awardXp.mutate(
      { amount: Math.floor(parsed), reason: awardXpReason.trim() },
      {
        onSuccess: () => {
          setAwardXpOpen(false);
          setAwardXpAmount("100");
          setAwardXpReason("");
        },
      },
    );
  };

  const handleDeleteUser = () => {
    deleteUser.mutate(undefined, {
      onSuccess: () => navigate("/admin/users"),
      onSettled: () => setShowDeleteConfirm(false),
    });
  };

  const handleStartImpersonation = () => {
    impersonate.mutate(undefined, {
      onSuccess: () => {
        setImpersonateOpen(false);
        // Bounce to /learn where the impersonated user would naturally land.
        // The banner stays sticky-top so the admin doesn't lose context.
        navigate(langPath("learn"));
      },
    });
  };

  if (userQ.isLoading || !userQ.data) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-text-muted">
          {userQ.isLoading ? t("common.loading") : "User not found"}
        </p>
      </div>
    );
  }

  const user = userQ.data;

  const tabs: { id: TabId; label: string }[] = [
    { id: "profile", label: t("admin.profile") },
    { id: "learning", label: t("admin.userLearning.tabLabel", "Learning") },
    { id: "subscriptions", label: t("admin.subscriptions") },
    { id: "content", label: t("admin.content") },
    { id: "srs", label: t("admin.srs", "SRS") },
    { id: "social", label: t("admin.socialTab", "Social") },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="truncate text-2xl font-bold text-text-primary">
              @{user.username}
            </h1>
            <a
              href={`/u/${user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              title={t("admin.openProfile", "Open public profile")}
              aria-label={t("admin.openProfile", "Open public profile")}
              className="shrink-0 rounded-lg p-1.5 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
            >
              <Icon name="externalLink" size={18} aria-hidden />
            </a>
          </div>
          <p className="text-sm text-text-muted">
            {user.display_name} · {user.id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setImpersonateOpen(true)}
            data-testid="impersonate-act-as"
          >
            {t("admin.impersonate.button", "Act as user")}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setAwardXpOpen(true)}>
            {t("admin.awardXp.button", "Award XP")}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="icon"
            onClick={() => setShowDeleteConfirm(true)}
            title={t("admin.deleteUser")}
            aria-label={t("admin.deleteUser")}
          >
            <Icon name="trash" size={18} aria-hidden />
          </Button>
        </div>
      </div>

      {awardXpOpen ? (
        <AwardXpModal
          username={user.username}
          amount={awardXpAmount}
          reason={awardXpReason}
          onAmountChange={setAwardXpAmount}
          onReasonChange={setAwardXpReason}
          onSubmit={handleAwardXp}
          onClose={() => setAwardXpOpen(false)}
          submitting={awardXp.isPending}
        />
      ) : null}

      {showDeleteConfirm ? (
        <ConfirmModal
          title={t("admin.deleteUser")}
          message={t("admin.deleteConfirm")}
          cancelLabel={t("forum.cancel")}
          confirmLabel={deleteUser.isPending ? t("common.loading") : "Delete"}
          danger
          onConfirm={handleDeleteUser}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      ) : null}

      {impersonateOpen ? (
        <ImpersonateConfirmModal
          targetUsername={user.username}
          targetDisplayName={user.display_name ?? ""}
          onConfirm={handleStartImpersonation}
          onCancel={() => setImpersonateOpen(false)}
          busy={impersonate.isPending}
        />
      ) : null}

      <TabList className="gap-6">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </TabButton>
        ))}
      </TabList>

      <div className="rounded-card border border-border bg-surface p-6">
        {activeTab === "profile" && userId && <ProfileTab user={user} userId={userId} />}
        {activeTab === "learning" && userId && <LearningTab userId={userId} />}
        {activeTab === "subscriptions" && userId && (
          <SubscriptionsTab userId={userId} subscriptions={subsQ.data ?? []} />
        )}
        {activeTab === "content" && userId && (
          <ContentTab userId={userId} content={contentQ.data ?? []} />
        )}
        {activeTab === "srs" && userId && <SrsTab userId={userId} />}
        {activeTab === "social" && userId && <SocialTab userId={userId} />}
      </div>
    </div>
  );
}
