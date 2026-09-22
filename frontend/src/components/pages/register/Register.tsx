"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile, useRegister, IRegisterBody } from "@/hooks/auth/useAuth";

const googleAuthUrl = `${
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
}/auth/google`;

const Register = () => {
  const router = useRouter();
  const { data: currentUser } = useProfile();
  const { mutate: registerUser, isPending, error } = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IRegisterBody>();

  useEffect(() => {
    if (currentUser) {
      router.replace("/");
    }
  }, [currentUser, router]);

  const onSubmit = (body: IRegisterBody) => {
    registerUser(body, {
      onSuccess: () => router.push("/"),
    });
  };

  return (
    <AuthLayout
      badge="Create account"
      title="Join Operator AI"
      subtitle="Create your account and start managing your work with AI."
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fullName" className="text-sm font-medium text-foreground">
            Full name
          </label>
          <Input
            id="fullName"
            type="text"
            placeholder="Enter your full name"
            autoComplete="name"
            aria-invalid={!!errors.name}
            {...register("name", { required: "Full name is required" })}
          />
          {errors.name && (
            <span className="text-xs text-destructive">{errors.name.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email", { required: "Email is required" })}
          />
          {errors.email && (
            <span className="text-xs text-destructive">{errors.email.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="Create a password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register("password", {
              required: "Password is required",
              minLength: { value: 6, message: "At least 6 characters" },
            })}
          />
          {errors.password && (
            <span className="text-xs text-destructive">{errors.password.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="avatar" className="text-sm font-medium text-foreground">
            Avatar <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input id="avatar" type="file" accept="image/*" {...register("avatar")} />
        </div>

        {error && (
          <p className="text-sm text-destructive">
            {error.response?.data?.message || "Something went wrong. Please try again."}
          </p>
        )}

        <Button type="submit" size="lg" className="mt-1 w-full" disabled={isPending}>
          {isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs font-medium tracking-wide text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        OR
        <div className="h-px flex-1 bg-border" />
      </div>

      <a
        href={googleAuthUrl}
        className="flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <FcGoogle className="size-4.5" />
        Continue with Google
      </a>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
