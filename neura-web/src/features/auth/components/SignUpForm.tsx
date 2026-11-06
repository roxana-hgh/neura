import {  useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputAlt } from "@/components/ui/inputAlt";
import { signUp } from "@/lib/auth-client";
import GoogleButton from "@/features/auth/components/GoogleButton";
import { useState } from "react";
import AuthDivider from "@/features/auth/components/AuthDivider";
import PasswordInput from "@/features/auth/components/PasswordInput";

const signUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

function SignUpForm() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async (data: SignUpFormData) => {
    setServerError(null);
    const { error } = await signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    if (error) {
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
        <Label className={label}>Name</Label>
        <InputAlt className="h-9" placeholder="Your name" autoComplete="name" {...register("name")} />
        {errors.name && <p className={error}>{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <Label className={label}>Email</Label>
        <InputAlt className="h-9" placeholder="you@example.com" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className={error}>{errors.email.message}</p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label className={label}>Password</Label>
          <PasswordInput className="h-9" placeholder="Min. 8 chars" autoComplete="new-password" {...register("password")} />
          {errors.password && <p className={error}>{errors.password.message}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <Label className={label}>Confirm</Label>
          <PasswordInput className="h-9" placeholder="Repeat it" autoComplete="new-password" {...register("confirmPassword")} />
          {errors.confirmPassword && <p className={error}>{errors.confirmPassword.message}</p>}
        </div>
      </div>

      {serverError && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-center text-xs text-red-600">
          {serverError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="mt-1 h-9 w-full bg-neutral-900 text-white hover:bg-neutral-800">
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
    </form>

    <AuthDivider label="Or sign up with" />
    <GoogleButton label="Google" disabled={isSubmitting} />
  </div>
);
}

export default SignUpForm;