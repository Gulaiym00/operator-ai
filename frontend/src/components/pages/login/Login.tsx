"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin, useProfile, ILoginBody } from "@/hooks/auth/useAuth";

const googleAuthUrl = `${
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
}/auth/google`;

const Login = () => {
  const router = useRouter();
  const { data: currentUser } = useProfile();
  const { mutate: login, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ILoginBody>();

  useEffect(() => {
    if (currentUser) {
      router.replace("/");
    }
  }, [currentUser, router]);

  const onSubmit = (body: ILoginBody) => {
    login(body, {
      onSuccess: () => router.push("/"),
    });
  };

  return (
    <AuthLayout
      badge="Welcome back"
      title="Sign in to Operator AI"
      subtitle="Enter your details to pick up right where you left off."
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="text-sm font-medium text-foreground"
          >
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            {...register("email", { required: "Email is required" })}
          />
          {errors.email && (
            <span className="text-xs text-destructive">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            aria-invalid={!!errors.password}
            {...register("password", { required: "Password is required" })}
          />
          {errors.password && (
            <span className="text-xs text-destructive">
              {errors.password.message}
            </span>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive">
            {error.response?.data?.message ||
              "Something went wrong. Please try again."}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="mt-1 w-full"
          disabled={isPending}
        >
          {isPending ? "Signing in..." : "Sign in"}
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
        Don't have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground hover:underline"
        >
          Create account
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
