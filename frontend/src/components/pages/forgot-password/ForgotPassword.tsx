"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { MailCheck } from "lucide-react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IForgotPasswordBody, useForgotPassword } from "@/hooks/auth/useAuth";

const ForgotPassword = () => {
  const { mutate: forgotPassword, isPending, error } = useForgotPassword();
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IForgotPasswordBody>();

  const onSubmit = (body: IForgotPasswordBody) => {
    forgotPassword(body, {
      onSuccess: () => setSentTo(body.email),
    });
  };

  if (sentTo) {
    return (
      <AuthLayout
        badge="Check your email"
        title="Reset link sent"
        subtitle=""
      >
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-8 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="size-5" />
          </div>
          <p className="text-sm text-foreground">
            If <span className="font-medium">{sentTo}</span> is registered with a
            password, we've sent a link to reset it. The link expires in 1 hour.
          </p>
          <Link
            href="/login"
            className="mt-2 text-sm font-medium text-foreground hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      badge="Forgot password"
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to reset it."
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
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
            <span className="text-xs text-destructive">{errors.email.message}</span>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive">
            {error.response?.data?.message || "Something went wrong. Please try again."}
          </p>
        )}

        <Button type="submit" size="lg" className="mt-1 w-full" disabled={isPending}>
          {isPending ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered your password?{" "}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPassword;
