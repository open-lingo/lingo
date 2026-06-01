import { useNavigate } from "react-router-dom";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { QuestsPanel } from "./components/QuestsPanel";

/**
 * Page-level entry for /:lang/quests. Wraps the QuestsPanel modal so
 * users can land here from a direct link or the top-bar pill. Closing
 * the panel jumps back to the learn page.
 */
export default function QuestsPage() {
  const navigate = useNavigate();
  const langPath = useLangPath();
  return (
    <QuestsPanel
      isOpen
      onClose={() => navigate(langPath("learn"))}
    />
  );
}
