"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, User as UserIcon, Users } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

import { useProfile } from "@/hooks/auth/useAuth";
import { useAdminUsers } from "@/hooks/admin/useAdminUsers";
import { resolveAvatarUrl } from "@/lib/media";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const formatDate = (createdAt: string) => {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const AppUsers = () => {
  const router = useRouter();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const { data: users, isLoading: isUsersLoading } = useAdminUsers();

  useEffect(() => {
    if (!isProfileLoading && !profile?.is_admin) {
      router.replace("/");
    }
  }, [isProfileLoading, profile, router]);

  if (isProfileLoading || !profile?.is_admin) {
    return null;
  }

  return (
    <section>
      <div className="container py-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <header className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Application users
              </h1>
              <p className="text-sm text-muted-foreground">
                Everyone registered in Operator AI — separate from your CRM contacts.
              </p>
            </div>
          </header>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {isUsersLoading ? (
              <div className="flex flex-col gap-3 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Sign-in</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {(users || []).map((user) => (
                    <tr key={user.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar size="sm">
                            <AvatarImage
                              src={resolveAvatarUrl(user.avatar ?? undefined)}
                              alt={user.name}
                            />
                            <AvatarFallback>
                              {user.name?.[0]?.toUpperCase() || (
                                <UserIcon className="size-4" />
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {user.name}
                            </span>
                            {user.is_admin && (
                              <span className="flex items-center gap-1 text-xs text-primary">
                                <ShieldCheck className="size-3" />
                                Admin
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="flex flex-col">
                          <span>{user.email}</span>
                          {user.phone && <span>{user.phone}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {user.has_google ? (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <FcGoogle className="size-4" />
                            Google
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Password</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(user.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!isUsersLoading && (users || []).length === 0 && (
              <div className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
                <Users className="size-8" />
                <p>No registered users yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppUsers;
