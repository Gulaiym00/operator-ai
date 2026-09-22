"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Camera,
  LogOut,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  User as UserIcon,
  X,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";

import {
  IUpdateProfileBody,
  useLogout,
  useProfile,
  useUpdateProfile,
} from "@/hooks/auth/useAuth";
import { resolveAvatarUrl } from "@/lib/media";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const formatMemberSince = (createdAt?: string) => {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const Profile = () => {
  const router = useRouter();
  const { data: user, isLoading } = useProfile();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const {
    mutate: updateProfile,
    isPending: isSaving,
    error: saveError,
    reset: resetSaveError,
  } = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<IUpdateProfileBody>();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  const watchedAvatar = watch("avatar");
  const avatarPreview = useMemo(() => {
    const file = watchedAvatar?.[0];
    return file ? URL.createObjectURL(file) : undefined;
  }, [watchedAvatar]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const startEditing = () => {
    reset({ name: user?.name, age: user?.age ?? undefined, phone: user?.phone ?? "" });
    resetSaveError();
    setIsEditing(true);
  };

  const cancelEditing = () => {
    reset({
      name: user?.name,
      avatar: undefined,
      age: user?.age ?? undefined,
      phone: user?.phone ?? "",
    });
    resetSaveError();
    setIsEditing(false);
  };

  const onSubmit = (body: IUpdateProfileBody) => {
    updateProfile(body, {
      onSuccess: () => setIsEditing(false),
    });
  };

  const handleLogout = () => {
    logout(undefined, {
      onSettled: () => router.push("/login"),
    });
  };

  const memberSince = formatMemberSince(user?.created_at);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 md:px-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your Operator AI account details.
          </p>
        </div>

        {!isLoading && user && !isEditing && (
          <Button variant="outline" size="sm" onClick={startEditing}>
            <Pencil className="size-3.5" />
            Edit
          </Button>
        )}
      </header>

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
        </div>
      ) : user ? (
        <form
          className="rounded-2xl border border-border bg-card p-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          {/* IDENTITY */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Avatar className="size-16">
                <AvatarImage
                  src={avatarPreview || resolveAvatarUrl(user.avatar)}
                  alt={user.name}
                />
                <AvatarFallback className="text-lg">
                  {user.name?.[0]?.toUpperCase() || (
                    <UserIcon className="size-6" />
                  )}
                </AvatarFallback>
              </Avatar>

              {isEditing && (
                <label
                  htmlFor="avatar"
                  title="Change avatar"
                  className="absolute -right-1 -bottom-1 flex size-6 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-muted"
                >
                  <Camera className="size-3.5" />
                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    {...register("avatar")}
                  />
                </label>
              )}
            </div>

            <div className="min-w-0 flex-1">
              {isEditing ? (
                <div className="max-w-xs">
                  <Input
                    className="h-9"
                    placeholder="Your name"
                    aria-invalid={!!errors.name}
                    {...register("name", { required: "Name is required" })}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
              ) : (
                <h2 className="truncate text-lg font-semibold text-foreground">
                  {user.name}
                </h2>
              )}

              <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                <Mail className="size-3.5 shrink-0" />
                {user.email}
              </p>
            </div>
          </div>

          {isEditing && (
            <div className="mt-4 flex items-center gap-2">
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={cancelEditing}
                disabled={isSaving}
              >
                <X className="size-3.5" />
                Cancel
              </Button>
            </div>
          )}

          {saveError && (
            <p className="mt-3 text-sm text-destructive">
              {saveError.response?.data?.message ||
                "Couldn't save your changes. Please try again."}
            </p>
          )}

          <Separator className="my-6" />

          {/* DETAILS */}
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Account type
              </dt>
              <dd className="mt-1 flex items-center gap-1.5 text-sm text-foreground">
                {user.google_id ? (
                  <>
                    <FcGoogle className="size-4" />
                    Google account
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4 text-muted-foreground" />
                    Email &amp; password
                  </>
                )}
              </dd>
            </div>

            {memberSince && (
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Member since
                </dt>
                <dd className="mt-1 text-sm text-foreground">{memberSince}</dd>
              </div>
            )}

            <div>
              <dt className="text-xs font-medium text-muted-foreground">Age</dt>
              {isEditing ? (
                <Input
                  type="number"
                  className="mt-1 h-8 max-w-[120px]"
                  placeholder="Age"
                  min={0}
                  max={150}
                  {...register("age", { valueAsNumber: true })}
                />
              ) : (
                <dd className="mt-1 text-sm text-foreground">
                  {user.age ?? "—"}
                </dd>
              )}
            </div>

            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Phone number
              </dt>
              {isEditing ? (
                <Input
                  type="tel"
                  className="mt-1 h-8"
                  placeholder="+1 555 000 0000"
                  {...register("phone")}
                />
              ) : (
                <dd className="mt-1 flex items-center gap-1.5 text-sm text-foreground">
                  {user.phone ? (
                    <>
                      <Phone className="size-3.5 text-muted-foreground" />
                      {user.phone}
                    </>
                  ) : (
                    "—"
                  )}
                </dd>
              )}
            </div>
          </dl>

          <Separator className="my-6" />

          <Button
            type="button"
            variant="outline"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="size-4" />
            {isLoggingOut ? "Logging out..." : "Log out"}
          </Button>
        </form>
      ) : null}
    </div>
  );
};

export default Profile;
