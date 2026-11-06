import {  useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputAlt } from "@/components/ui/inputAlt";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import z from "zod";
import GoogleButton from "@/features/auth/components/GoogleButton";
import AuthDivider from "@/features/auth/components/AuthDivider";
import PasswordInput from "@/features/auth/components/PasswordInput";

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
      // Better Auth returns "Invalid email or password" for wrong credentials
      setServerError(error.message ?? "Something went wrong. Please try again.");
      return;
    }

    navigate("/");
  };

const label = "text-xs font-medium text-neutral-600";
const error = "text-[11px] text-red-500";

return (
  <div className="flex flex-col gap-4">
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1">
        <Label className={label}>Email</Label>
        <InputAlt className="h-9" placeholder="you@example.com" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className={error}>{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <Label className={label}>Password</Label>
        <PasswordInput className="h-9" placeholder="Enter your password" autoComplete="current-password" {...register("password")} />
        {errors.password && <p className={error}>{errors.password.message}</p>}
      </div>

      {serverError && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-center text-xs text-red-600">
          {serverError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="mt-1 h-9 w-full bg-neutral-900 text-white hover:bg-neutral-800">
        {isSubmitting ? "Logging in..." : "Login"}
      </Button>
    </form>

    <AuthDivider />
    <GoogleButton label="Google" disabled={isSubmitting} />
  </div>
);
}

export default LoginForm;