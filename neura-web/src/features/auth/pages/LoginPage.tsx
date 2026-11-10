import { useTranslation } from "react-i18next";
// LoginPage.tsx
import { Link } from "react-router-dom";
import LoginForm from "@/features/auth/components/LoginForm";
import LoginSignUpLayout from "@/features/auth/components/LoginSignUpLayout";

function LoginPage() {
  const { t } = useTranslation();
  return (
    <LoginSignUpLayout
      title={t("auth.welcomeBack")}
      subtitle={t("auth.signInSubtitle")}
      footer={
        <>
          {t("auth.noAccount")}
          <Link to="/signup">{t("auth.signUp")}</Link>
        </>
      }
    >
      <LoginForm />
    </LoginSignUpLayout>
  );
}

export default LoginPage;