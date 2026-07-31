import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { InputAlt } from "../../ui/inputAlt";
import { signUp } from "../../../lib/auth-client";

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

  const onSubmit = async (data: SignUpFormData) => {
    const { error } = await signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    if (error) {
      console.error(error);
      return;
    }

    navigate("/");
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4">
          <div>
            <Label className="mb-1 px-1 text-sm block">Name</Label>
            <InputAlt
              placeholder="enter your name"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <Label className="mb-1 px-1 text-sm block">Email</Label>
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
            <Label className="mb-1 px-1 text-sm block">Password</Label>
            <InputAlt
              placeholder="Password"
              type="password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>
          <div>
            <Label className="mb-1 px-1 text-sm block">Confirm Password</Label>
            <InputAlt
              placeholder="Confirm password"
              type="password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
          <Button variant="default" className="mt-3 bg-neutral-900 text-white hover:bg-neutral-800" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Sign Up"}
          </Button>
          <p className="text-muted-foreground text-sm text-center w-full my-1">
            Already have an account?
            <Link
              to={"/login"}
              className="text-neutral-800 font-medium hover:underline mx-2"
            >
              Login
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

export default SignUpForm;