import Link from "next/link";
import Image from "next/image";
import { Activity, Blocks, Bot, CalendarClock, Gauge, GitBranch } from "lucide-react";
import { GlobalSearch } from "@/components/global-search";
import { Badge } from "@/components/ui/badge";

const nav = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/transactions", label: "Transactions", icon: Activity },
  { href: "/blocks", label: "Blocks", icon: Blocks },
  { href: "/async", label: "Async", icon: GitBranch },
  { href: "/scheduled", label: "Scheduled", icon: CalendarClock },
  { href: "/agents", label: "Agents", icon: Bot }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ritual-cream">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:p-3">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-ritual-line bg-ritual-cream/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <span className="relative flex size-10 items-center justify-center overflow-hidden rounded-lg border border-ritual-line bg-white shadow-sm">
              <Image
                src="/background-logo.png"
                alt="Ritual Watch logo"
                width={40}
                height={40}
                className="h-full w-full object-cover"
                priority
              />
            </span>
            <span>
              <span className="block text-lg font-black">Ritual Watch</span>
              <span className="block text-xs font-semibold text-ritual-muted">Track Ritual Testnet in real time.</span>
            </span>
          </Link>
          <nav className="flex gap-1 lg:ml-4">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="focus-ring inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-ritual-muted hover:bg-black/5 hover:text-ritual-ink">
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="min-w-0 flex-1 lg:max-w-xl lg:ml-auto">
            <GlobalSearch compact />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="mb-6">
          <Badge className="border-ritual-green/25 bg-ritual-green/10 text-ritual-green">
            Ritual Watch tracks Ritual Testnet activity. Testnet assets have no real value.
          </Badge>
        </div>
        {children}
      </main>
    </div>
  );
}
