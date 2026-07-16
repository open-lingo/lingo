import { useState } from "react";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { SettingsNav } from "./SettingsNav";
import { SettingsSectionPanel } from "./SettingsSectionPanel";
import type { SettingsSectionId } from "./settingsSections";

export function SettingsContent({ initialSection }: { initialSection?: string } = {}) {
  const { languages } = useLanguage();
  const [activeSection, setActiveSection] = useState<SettingsSectionId>(
    (initialSection as SettingsSectionId) ?? "general",
  );

  return (
    <div className="flex h-full min-h-0 flex-col sm:flex-row">
      <SettingsNav
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        languages={languages}
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
        <SettingsSectionPanel section={activeSection} />
      </div>
    </div>
  );
}
