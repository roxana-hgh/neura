// SignUpPage.tsx
import { Link } from "react-router-dom";
import SignUpForm from "@/features/auth/components/SignUpForm";
import LoginSignUpLayout from "@/features/auth/components/LoginSignUpLayout";

function SignUpPage() {
  return (
    <LoginSignUpLayout
      title="Create your account"
      subtitle="Start organizing your work and your life"
      footer={
        <>
          Already have an account?
          <Link to="/login">Log in</Link>
        </>
      }
    >
      <SignUpForm />
    </LoginSignUpLayout>
  );
}

export default SignUpPage;