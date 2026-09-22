import Link from "next/link";
import {
  KanbanSquare,
  Mail,
  Sparkles,
} from "lucide-react";

const highlights = [
  { icon: Mail, label: "Real Gmail, Calendar & Drive — connected live" },
  { icon: KanbanSquare, label: "A kanban board and CRM, always in sync" },
  { icon: Sparkles, label: "Ask Operator AI to read, draft and act for you" },
];

interface AuthLayoutProps {
  children: React.ReactNode;
  badge: string;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, badge, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-[calc(100vh-56px)] w-full bg-background">
      {/* LEFT — branding panel */}
      <div className="relative hidden w-[40%] flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 15%, currentColor 0, transparent 45%), radial-gradient(circle at 85% 75%, currentColor 0, transparent 40%)",
          }}
        />

        <Link href="/" className="relative z-10 flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary-foreground/15">
            <Sparkles className="size-4" />
          </div>
          <span className="text-lg font-semibold">Operator AI</span>
        </Link>

        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-semibold leading-tight">
            Your work, in one place.
          </h2>
          <p className="max-w-sm text-sm text-primary-foreground/70">
            Email, Calendar, Drive, Notes, Tasks and CRM — one AI that reads,
            drafts, and acts across all of them.
          </p>

          <ul className="space-y-3">
            {highlights.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-start gap-3 text-sm text-primary-foreground/90"
              >
                <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-primary-foreground/15">
                  <Icon className="size-3.5" />
                </div>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} Operator AI
        </p>
      </div>

      {/* RIGHT — form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm">
          <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
            {badge}
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-foreground">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>

          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
