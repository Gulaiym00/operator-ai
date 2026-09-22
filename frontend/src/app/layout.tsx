import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import "./globals.css";
import { AppSidebar } from "@/components/layout/AppSideBar";
import { TooltipProvider } from "@/components/ui/tooltip";
import QueryProvider from "@/components/providers/QueryProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Operator AI",
  description: "AI-powered workspace",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <QueryProvider>
          <TooltipProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <header className="flex h-14 items-center gap-2 border-b px-4">
                  <SidebarTrigger />
                  <div className="h-4 w-px bg-border" />
                  <span className="text-sm font-medium">Operator AI</span>
                </header>
                <main className="flex-1">{children}</main>
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
