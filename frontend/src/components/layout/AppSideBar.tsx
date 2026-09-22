"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlignVerticalJustifyStart,
  Bot,
  Calendar,
  ChevronDown,
  HardDrive,
  LogIn,
  LogOut,
  LucideNotebookTabs,
  Mail,
  Plus,
  Sparkles,
  User,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLogout, useProfile } from "@/hooks/auth/useAuth";
import { resolveAvatarUrl } from "@/lib/media";
import { RecentChats } from "./RecentChats";

const mainNavigation = [
  {
    title: "Email",
    href: "/email",
    icon: Mail,
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: Calendar,
  },
  {
    title: "Drive",
    href: "/drive",
    icon: HardDrive,
  },
  {
    title: "Notes",
    href: "/notes",
    icon: LucideNotebookTabs,
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: AlignVerticalJustifyStart,
  },
  {
    title: "Contacts",
    href: "/contacts",
    icon: Users,
  },
];

const adminNavigation = [
  {
    title: "App users",
    href: "/admin/users",
    icon: Users,
  },
];

const agentNavigation = [
  {
    title: "Chat with AI ",
    href: "/",
    icon: Bot,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isLoading } = useProfile();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { isMobile, setOpenMobile } = useSidebar();

  // на телефоне меню — выезжающая панель поверх страницы: после перехода по
  // любой ссылке внутри неё (раздел, «New chat», чат из истории) её нужно закрыть
  const closeOnNavigate = (event: React.MouseEvent) => {
    if (isMobile && (event.target as HTMLElement).closest("a")) {
      setOpenMobile(false);
    }
  };

  const handleLogout = () => {
    logout(undefined, {
      onSettled: () => router.push("/login"),
    });
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}`);
  };

  return (
    <Sidebar collapsible="icon">
      {/* LOGO */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/" />}
              tooltip="Operator AI"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="size-4" />
              </div>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Operator AI</span>
                <span className="truncate text-xs text-muted-foreground">
                  AI Workspace
                </span>
              </div>
              <ChevronDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* CONTENT */}
      <SidebarContent onClick={closeOnNavigate}>
        {/* WORKSPACE */}
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive(item.href)}
                      tooltip={item.title}
                    >
                      <Icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ADMIN — только для аккаунта с is_admin, остальные не видят этот пункт */}
        {user?.is_admin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={isActive(item.href)}
                        tooltip={item.title}
                      >
                        <Icon className="size-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* AI AGENTS */}
        <SidebarGroup>
          <SidebarGroupLabel>AI Agents</SidebarGroupLabel>
          {/* NEW TASK */}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/" />}
                tooltip="New chat"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              >
                <Plus className="size-4" />
                <span>New chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* RECENT CHATS — useSearchParams требует Suspense-границу */}
        <Suspense fallback={null}>
          <RecentChats />
        </Suspense>
      </SidebarContent>
      {/* FOOTER */}
      <SidebarFooter>
        <SidebarMenu>
          {!isLoading && user ? (
            <SidebarMenuItem>
              <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
                <Link
                  href="/profile"
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-lg hover:bg-muted"
                >
                  <Avatar size="lg">
                    <AvatarImage
                      src={resolveAvatarUrl(user.avatar)}
                      alt={user.name}
                    />
                    <AvatarFallback>
                      {user.name?.[0]?.toUpperCase() || (
                        <User className="size-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>

                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  title="Log out"
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            </SidebarMenuItem>
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/login" />}
                isActive={isActive("/login")}
                tooltip="Sign in"
              >
                <LogIn className="size-4" />
                <span>Sign in</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
