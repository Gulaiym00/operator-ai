"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { CheckCircle2, TriangleAlert } from "lucide-react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useResetPassword } from "@/hooks/auth/useAuth";

interface FormValues {
  password: string;
  confirmPassword: string;
}

const ResetPasswordContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { mutate: resetPassword, isPending, error } = useResetPassword();
  const [isDone, setIsDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit = (values: FormValues) => {
    if (!token) return;

    resetPassword(
      { token, password: values.password },
      { onSuccess: () => setIsDone(true) },
    );
  };

  if (!token) {
    return (
      <AuthLayout badge="Reset password" title="Invalid link" subtitle="">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-8 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <TriangleAlert className="size-5" />
          </div>
          <p className="text-sm text-foreground">
            This reset link is missing or malformed. Request a new one from the
            login page.
          </p>
          <Link
            href="/forgot-password"
            className="mt-2 text-sm font-medium text-foreground hover:underline"
          >
            Request a new link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (isDone) {
    return (
      <AuthLayout badge="Reset password" title="Password updated" subtitle="">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-8 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="size-5" />
          </div>
          <p className="text-sm text-foreground">
            Your password has been updated. You can now sign in with it.
          </p>
          <Button size="sm" className="mt-2" onClick={() => router.push("/login")}>
            Go to sign in
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      badge="Reset password"
      title="Choose a new password"
      subtitle="Make it something you haven't used before."
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            New password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="Create a new password"
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
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-foreground"
          >
            Confirm password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter your new password"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (value) =>
                value === watch("password") || "Passwords don't match",
            })}
          />
          {errors.confirmPassword && (
            <span className="text-xs text-destructive">
              {errors.confirmPassword.message}
            </span>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive">
            {error.response?.data?.message || "Something went wrong. Please try again."}
          </p>
        )}

        <Button type="submit" size="lg" className="mt-1 w-full" disabled={isPending}>
          {isPending ? "Updating..." : "Update password"}
        </Button>
      </form>
    </AuthLayout>
  );
};

const ResetPassword = () => (
  <Suspense fallback={null}>
    <ResetPasswordContent />
  </Suspense>
);

export default ResetPassword;
