import PageHeader from "@/components/shared/PageHeader";
import AccountSection from "@/features/settings/components/AccountSection";
import AppearanceSection from "@/features/settings/components/AppearanceSection";
import CalendarSection from "@/features/settings/components/CalendarSection";
import SessionSection from "@/features/settings/components/SessionSection";

function SettingsPage() {
  return (
    <div className="container mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Settings"
        title="Account & preferences"
        description="Manage your profile, how Neura looks and how weeks are laid out."
      />

      <div className="space-y-6 md:space-y-8">
        <AccountSection />
        <div className="border-t border-border" />
        <AppearanceSection />
        <div className="border-t border-border" />
        <CalendarSection />
        <div className="border-t border-border" />
        <SessionSection />
      </div>
    </div>
  );
}

export default SettingsPage;
