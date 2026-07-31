import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { InputAlt } from "../../ui/inputAlt";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { authClient } from "../../../lib/auth-client";
import z from "zod";

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

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4">

          <div>
            <Label className="px-1 text-sm block">Email</Label>
            <InputAlt
              placeholder="example@example.com"
              type="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label className="px-1 text-sm block">Password</Label>
            <InputAlt
              placeholder="password"
              type="password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Server-side errors: wrong credentials, unverified email, etc. */}
          {serverError && (
            <p className="text-sm text-red-500 text-center -mt-1">{serverError}</p>
          )}

          <Button variant="default" className="mt-3 bg-neutral-900 text-white hover:bg-neutral-800" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>

          <p className="text-muted-foreground text-sm text-center w-full my-1">
            Don't have an account?
            <Link to="/signup" className="text-neutral-800 font-medium hover:underline mx-2">
              Sign Up
            </Link>
          </p>

        </div>
      </form>
    </div>
  );
}

export default LoginForm;