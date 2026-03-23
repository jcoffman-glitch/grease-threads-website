"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { SessionProvider } from "next-auth/react";
import { useState, useEffect } from "react";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "🏠" },
  { href: "/admin/jobs", label: "Jobs", icon: "🔧" },
  { href: "/admin/invoices", label: "Invoices", icon: "💰" },
  { href: "/admin/inventory", label: "Inventory", icon: "📦" },
  { href: "/admin/price-list", label: "Price List", icon: "🏷️" },
  { href: "/admin/service-log", label: "Service Log", icon: "📋" },
  { href: "/admin/marketing", label: "Marketing", icon: "📣" },
  { href: "/admin/reports", label: "Reports", icon: "📊" },
];

// Bottom nav items for mobile
const bottomNavItems = [
  { href: "/admin", label: "Dashboard", icon: "🏠" },
  { href: "/admin/jobs", label: "Jobs", icon: "📋" },
  { href: "/admin/invoices", label: "Invoices", icon: "🧾" },
];

function InstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (!dismissed && !isStandalone) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-sm md:hidden">
      <span className="text-amber-800">📱 Install this app: tap Share → Add to Home Screen</span>
      <button
        onClick={() => {
          localStorage.setItem("pwa-install-dismissed", "1");
          setShow(false);
        }}
        className="text-amber-600 ml-2 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}

function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 md:hidden safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {bottomNavItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-4 py-2 text-xs ${
                active ? "text-amber-500" : "text-gray-500"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
        {/* Center + New Job button */}
        <button
          onClick={() => router.push("/admin/jobs?new=1")}
          className="flex flex-col items-center gap-1 px-4 py-2 text-xs text-white"
        >
          <span className="bg-amber-500 rounded-full w-12 h-12 flex items-center justify-center text-2xl shadow-lg">
            ➕
          </span>
        </button>
      </div>
    </nav>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <ServiceWorkerRegistration />
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-navy text-white transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 flex flex-col`}
      >
        <div className="p-4 border-b border-navy-light">
          <h1 className="text-lg font-bold text-amber">Grease &amp; Threads</h1>
          <p className="text-xs text-gray-400">Admin Panel</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-amber text-navy font-semibold"
                    : "text-gray-300 hover:bg-navy-light hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-navy-light">
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-navy-light rounded-lg transition-colors text-left"
          >
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <InstallBanner />
        <header className="bg-navy text-white px-4 py-3 flex items-center gap-3 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white p-1"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-amber">Grease &amp; Threads</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AdminShell>{children}</AdminShell>
    </SessionProvider>
  );
}
