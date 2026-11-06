import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputAlt } from "@/components/ui/inputAlt";
import { authClient } from "@/lib/auth-client";
import GoogleButton from "@/features/auth/components/GoogleButton";
import AuthDivider from "@/features/auth/components/AuthDivider";
import PasswordInput from "@/features/auth/components/PasswordInput";
import { authStyles as s } from "@/features/auth/lib/authStyles";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setServerError(error.message ?? "Something went wrong. Please try again.");
      return;
    }

    navigate("/");
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
        <div className="flex flex-col gap-1">
          <Label className={s.label}>Email</Label>
          <InputAlt
            className={s.input}
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && <p className={s.error}>{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <Label className={s.label}>Password</Label>
          <PasswordInput
            className={s.input}
            placeholder="Enter your password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && <p className={s.error}>{errors.password.message}</p>}
        </div>

        {serverError && (
          <p role="alert" className={s.serverError}>
            {serverError}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className={s.primaryButton}>
          {isSubmitting ? "Logging in..." : "Login"}
        </Button>
      </form>

      <AuthDivider />
      <GoogleButton label="Google" disabled={isSubmitting} />
    </div>
  );
}

export default LoginForm;