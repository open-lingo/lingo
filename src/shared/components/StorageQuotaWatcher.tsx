import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/shared/contexts/ToastContext";
import {
  STORAGE_QUOTA_EVENT,
  type StorageQuotaDetail,
} from "@/shared/utils/storageQuota";

/**
 * Listens for the throttled `lingo:storage-quota` window event (dispatched by
 * `safeLocalStorageWrite` when local storage is near or at the ceiling) and
 * surfaces it on the existing toast surface as a warning. Mount once, globally.
 *
 * Renders nothing — it's a side-effect bridge from the plain storage modules
 * (which can't read React context) to the toast provider.
 */
export function StorageQuotaWatcher() {
  const { showToast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<StorageQuotaDetail>).detail;
      const message =
        detail?.reason === "exceeded"
          ? t("storage.quotaExceeded", {
              defaultValue:
                "Your device storage is full — recent progress may not be saved locally. Sync or free up space to keep your progress safe.",
            })
          : t("storage.quotaNear", {
              defaultValue:
                "Your device storage is almost full. Sync your progress soon so nothing is lost.",
            });
      showToast(message, "warning");
    };
    window.addEventListener(STORAGE_QUOTA_EVENT, handler);
    return () => window.removeEventListener(STORAGE_QUOTA_EVENT, handler);
  }, [showToast, t]);

  return null;
}
