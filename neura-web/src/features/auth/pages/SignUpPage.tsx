import { useTranslation } from "react-i18next";
// SignUpPage.tsx
import { Link } from "react-router-dom";
import SignUpForm from "@/features/auth/components/SignUpForm";
import LoginSignUpLayout from "@/features/auth/components/LoginSignUpLayout";

function SignUpPage() {
  const { t } = useTranslation();
  return (
    <LoginSignUpLayout
      title={t("auth.createYourAccount")}
      subtitle={t("auth.signUpSubtitle")}
      footer={
        <>
          {t("auth.haveAccount")}
          <Link to="/login">{t("auth.logIn")}</Link>
        </>
      }
    >
      <SignUpForm />
    </LoginSignUpLayout>
  );
}

export default SignUpPage;