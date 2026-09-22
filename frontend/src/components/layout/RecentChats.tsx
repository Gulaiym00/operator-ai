"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MessageSquare, Trash2 } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useProfile } from "@/hooks/auth/useAuth";
import {
  IConversation,
  useConversations,
  useDeleteConversation,
} from "@/hooks/chat/useChat";

const DAY = 24 * 60 * 60 * 1000;

// как в ChatGPT/Claude: «Today / Yesterday / Previous 7 days / Older»
const groupByDate = (conversations: IConversation[]) => {
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const buckets: { label: string; items: IConversation[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 days", items: [] },
    { label: "Older", items: [] },
  ];

  for (const conversation of conversations) {
    const age = startOfToday - new Date(conversation.updated_at).getTime();

    if (age <= 0) buckets[0]!.items.push(conversation);
    else if (age <= DAY) buckets[1]!.items.push(conversation);
    else if (age <= 7 * DAY) buckets[2]!.items.push(conversation);
    else buckets[3]!.items.push(conversation);
  }

  return buckets.filter((bucket) => bucket.items.length > 0);
};

export function RecentChats() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: user } = useProfile();
  const { data: conversations } = useConversations(!!user);
  const { mutate: deleteConversation } = useDeleteConversation();

  if (!user) return null;

  const activeId = pathname === "/" ? Number(searchParams.get("c")) || null : null;

  const handleDelete = (conversation: IConversation) => {
    if (!window.confirm(`Delete "${conversation.title}"? This can't be undone.`)) return;

    deleteConversation(conversation.id, {
      onSuccess: () => {
        if (activeId === conversation.id) router.push("/");
      },
    });
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Recent chats</SidebarGroupLabel>

      <SidebarGroupContent>
        {conversations && conversations.length === 0 && (
          <p className="px-2 py-2 text-xs text-sidebar-foreground/50">
            No chats yet — send a message and it will show up here.
          </p>
        )}

        {groupByDate(conversations ?? []).map((bucket) => (
          <div key={bucket.label}>
            <div className="px-2 pt-2 pb-1 text-[11px] font-medium text-sidebar-foreground/50">
              {bucket.label}
            </div>

            <SidebarMenu>
              {bucket.items.map((conversation) => (
                <SidebarMenuItem key={conversation.id}>
                  <SidebarMenuButton
                    render={<Link href={`/?c=${conversation.id}`} />}
                    isActive={activeId === conversation.id}
                    tooltip={conversation.title}
                  >
                    <MessageSquare className="size-4" />
                    <span>{conversation.title}</span>
                  </SidebarMenuButton>

                  <SidebarMenuAction
                    showOnHover
                    // на тач-экранах нет hover — кнопка удаления должна быть видна всегда
                    className="[@media(hover:none)]:opacity-100!"
                    title="Delete chat"
                    onClick={() => handleDelete(conversation)}
                  >
                    <Trash2 />
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        ))}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
