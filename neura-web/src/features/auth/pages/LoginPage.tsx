// LoginPage.tsx
import { Link } from "react-router-dom";
import LoginForm from "@/features/auth/components/LoginForm";
import LoginSignUpLayout from "@/features/auth/components/LoginSignUpLayout";

function LoginPage() {
  return (
    <LoginSignUpLayout
      title="Welcome back"
      subtitle="Sign in to continue to Neura"
      footer={
        <>
          Don't have an account?
          <Link to="/signup">Sign up</Link>
        </>
      }
    >
      <LoginForm />
    </LoginSignUpLayout>
  );
}

export default LoginPage;