import AccountSection from "../../components/features/setting/components/AccountSection";


function SettingsPage() {
  return (
    <div className=" container mx-auto ">
      <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage your account and preferences.</p>

      <div className="mt-8">
        <AccountSection />
      </div>
    </div>
  );
}

export default SettingsPage;