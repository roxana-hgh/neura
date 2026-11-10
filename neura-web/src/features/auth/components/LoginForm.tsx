import { useTranslation } from "react-i18next";
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
  email: z.string().email("auth.invalidEmail"),
  password: z.string().min(8, "auth.passwordMin"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const { t } = useTranslation();
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
      setServerError(error.message ?? t("auth.genericError"));
      return;
    }

    navigate("/");
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
        <div className="flex flex-col gap-1">
          <Label className={s.label}>{t("auth.email")}</Label>
          <InputAlt
            className={s.input}
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && <p className={s.error}>{t(errors.email.message!)}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <Label className={s.label}>{t("auth.password")}</Label>
          <PasswordInput
            className={s.input}
            placeholder={t("auth.enterPassword")}
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && <p className={s.error}>{t(errors.password.message!)}</p>}
        </div>

        {serverError && (
          <p role="alert" className={s.serverError}>
            {serverError}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className={s.primaryButton}>
          {isSubmitting ? t("auth.loggingIn") : t("auth.login")}
        </Button>
      </form>

      <AuthDivider />
      <GoogleButton label="Google" disabled={isSubmitting} />
    </div>
  );
}

export default LoginForm;