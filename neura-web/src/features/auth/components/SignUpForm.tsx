import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputAlt } from "@/components/ui/inputAlt";
import { signUp } from "@/lib/auth-client";
import GoogleButton from "@/features/auth/components/GoogleButton";
import AuthDivider from "@/features/auth/components/AuthDivider";
import PasswordInput from "@/features/auth/components/PasswordInput";
import { authStyles as s } from "@/features/auth/lib/authStyles";

const signUpSchema = z
  .object({
    name: z.string().min(2, "auth.nameMin"),
    email: z.string().email("auth.invalidEmail"),
    password: z.string().min(8, "auth.passwordMin"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "auth.passwordMismatch",
    path: ["confirmPassword"],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

function SignUpForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormData) => {
    setServerError(null);
    const { error } = await signUp.email({
      name: data.name,
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
          <Label className={s.label}>{t("auth.name")}</Label>
          <InputAlt
            className={s.input}
            placeholder={t("auth.yourName")}
            autoComplete="name"
            {...register("name")}
          />
          {errors.name && <p className={s.error}>{t(errors.name.message!)}</p>}
        </div>

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

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label className={s.label}>{t("auth.password")}</Label>
            <PasswordInput
              className={s.input}
              placeholder={t("auth.minChars")}
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && <p className={s.error}>{t(errors.password.message!)}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label className={s.label}>{t("auth.confirm")}</Label>
            <PasswordInput
              className={s.input}
              placeholder={t("auth.repeatIt")}
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className={s.error}>{t(errors.confirmPassword.message!)}</p>
            )}
          </div>
        </div>

        {serverError && (
          <p role="alert" className={s.serverError}>
            {serverError}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className={s.primaryButton}>
          {isSubmitting ? t("auth.creating") : t("auth.createAccount")}
        </Button>
      </form>

      <AuthDivider label={t("auth.orSignUp")} />
      <GoogleButton label="Google" disabled={isSubmitting} />
    </div>
  );
}

export default SignUpForm;