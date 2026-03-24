"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <header className="bg-navy text-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-amber">Grease</span> &amp;{" "}
          <span className="text-amber">Threads</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="hover:text-amber transition-colors">
            Home
          </Link>
          <Link
            href="/services"
            className="hover:text-amber transition-colors"
          >
            Services
          </Link>
          <Link href="/about" className="hover:text-amber transition-colors">
            About
          </Link>
          <Link href="/contact" className="hover:text-amber transition-colors">
            Contact
          </Link>
          <Link
            href={session ? "/account" : "/login"}
            className="hover:text-amber transition-colors text-sm"
          >
            {session ? "My Account" : "Sign In"}
          </Link>
          <a
            href="tel:8125643719"
            className="bg-amber hover:bg-amber-dark text-white font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            (812) 564-3719
          </a>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden bg-navy-light border-t border-white/10 px-4 pb-4">
          <div className="flex flex-col gap-3 pt-3">
            <Link
              href="/"
              className="py-2 hover:text-amber transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/services"
              className="py-2 hover:text-amber transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Services
            </Link>
            <Link
              href="/about"
              className="py-2 hover:text-amber transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="py-2 hover:text-amber transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Contact
            </Link>
            <Link
              href={session ? "/account" : "/login"}
              className="py-2 hover:text-amber transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {session ? "My Account" : "Sign In"}
            </Link>
            <a
              href="tel:8125643719"
              className="bg-amber hover:bg-amber-dark text-white font-semibold px-4 py-3 rounded-lg transition-colors text-center mt-2"
            >
              Call (812) 564-3719
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
