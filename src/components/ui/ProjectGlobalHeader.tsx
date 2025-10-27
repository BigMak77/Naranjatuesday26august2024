"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useContext } from "react";
import { useUser } from "@/lib/useUser";
import { supabase } from "@/lib/supabase-client";
import {
  FiUsers,
  FiFileText,
  FiShield,
  FiLogIn,
  FiLogOut,
  FiChevronDown,
  FiAlertOctagon,
  FiSearch,
} from "react-icons/fi";
import MyProfileModal from "@/components/user/MyProfileModal";
import Modal from "@/components/modal";
import NeonIconButton from "@/components/ui/NeonIconButton";
import { RaiseIssueModalContext } from "@/context/RaiseIssueModalContext";

type NavLink = {
  href?: string;
  label: string;
  icon: React.ReactElement;
  dropdown?: { href: string; label: string; className?: string }[];
};

type GlobalHeaderProps = {
  logoPriority?: boolean;
  /** Override/extend the default quick links (shown when signed-in). */
  navLinks?: NavLink[];
  /** Make header background full-bleed but keep content centered. */
  fullBleed?: boolean;
};

export default function GlobalHeader({
  logoPriority = false,
  navLinks,
  fullBleed = true,
}: GlobalHeaderProps) {
  const { user, loading } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [turkusDropdownOpen, setTurkusDropdownOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const raiseIssueModalCtx = useContext(RaiseIssueModalContext);
  const handleTurkusDropdown = () => setTurkusDropdownOpen((open) => !open);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      const dropdowns = document.querySelectorAll('.global-header-dropdown');
      let clickedInsideDropdown = false;
      dropdowns.forEach((dropdown) => {
        if (dropdown.contains(e.target as Node)) {
          clickedInsideDropdown = true;
        }
      });
      // User menu area
      const userMenu = document.querySelector('.global-header-user-menu');
      if (userMenu && userMenu.contains(e.target as Node)) {
        return;
      }
      if (!clickedInsideDropdown) setOpenDropdown(null);
      // If click is outside user menu, close user menu
      if (userMenu && !userMenu.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const links: NavLink[] = useMemo(
    () =>
      navLinks ?? [
        {
          label: "People & Roles",
          icon: <FiUsers />,
          dropdown: [
            { href: "/hr/people/", label: "People" },
            { href: "/admin/onboarding", label: "Onboarding" },
            { href: "/admin/roles/add", label: "Roles" },
            { href: "/hr/structure/", label: "Structure" },
            { href: "/admin/role-profiles/", label: "Role Profiles" },
            { href: "/admin/utility/", label: "Utilities" },
            { href: "/reports/", label: "Reports" },
            { href: "/admin/modules/", label: "Modules" },
            { href: "/manager/training/resources", label: "Training Resources" },
          ],
        },
        {
          label: "Turkus",
          icon: <FiFileText />,
          dropdown: [
            { href: "/turkus/audit", label: "Audit" },
            { href: "/tasks", label: "Tasks" },
            { href: "/turkus/issues", label: "Issues" },
            { href: "/turkus/documents", label: "Documents" },
          ],
        },
        { href: "/admin/incomplete", label: "Compliance", icon: <FiShield /> },
      ],
    [navLinks],
  );

  const initials = useMemo(() => {
    const name = (
      (user?.first_name ? user.first_name + " " : "") + (user?.last_name ?? "")
    ).trim();
    if (!name) return "U";
    const parts = name.split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts[1]?.[0] ?? "";
    return (first + last || first).toUpperCase();
  }, [user]);

  async function handleSignOut() {
    setSigningOut(true);
    setMenuOpen(false);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Optionally log error
    }
    // Use Next.js router for navigation to avoid race conditions
    if (typeof window !== "undefined") {
      window.location.replace("/homepage/login");
    }
    // If using useRouter, prefer router.replace("/homepage/login");
  }

  return (
    <>
      <header className="global-header">
        <div className="global-header-row">
          {/* Left: Logo */}
          <Link
            href="/"
            aria-label="Go to homepage"
            className="neon-text"
          >
            <Image
              src="/logo2.png"
              alt="Naranja"
              width={220}
              height={86}
              priority={logoPriority}
            />
          </Link>

          {/* Center: Quick links (signed-in) */}
          {!loading && user && (
            <nav aria-label="Primary">
              {links
                .filter((l) => l.dropdown || l.href)
                .map((l) =>
                  l.dropdown ? (
                    <div key={l.label} className="global-header-dropdown">
                      <button
                        type="button"
                        className="sidebar-action"
                        aria-haspopup="menu"
                        aria-expanded={openDropdown === l.label}
                        onClick={() => setOpenDropdown(openDropdown === l.label ? null : l.label)}
                      >
                        {l.label}
                      </button>
                      {openDropdown === l.label && (
                        <div role="menu">
                          {l.dropdown.map((d) => (
                            <Link
                              key={d.href}
                              href={d.href}
                              role="menuitem"
                              prefetch
                              className={d.className || "global-header-link neon-text"}
                              onClick={(e) => {
                                if (d.href?.startsWith('http') || d.href?.startsWith('mailto:') || d.href?.startsWith('tel:') || e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
                                setTimeout(() => setOpenDropdown(null), 80);
                              }}
                            >
                              {d.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    l.href && (
                      <Link
                        key={l.href}
                        href={l.href}
                        prefetch
                        className="global-header-link neon-text"
                      >
                        {l.label}
                      </Link>
                    )
                  )
                )}
            </nav>
          )}

          {/* Search Bar */}
          <form
            role="search"
            aria-label="Site search"
            className="global-header-search-form"
            onSubmit={(e) => e.preventDefault()}
          >
            <span className="global-header-search-icon" aria-hidden="true">
              <FiSearch />
            </span>
            <input
              id="global-header-search"
              type="search"
              placeholder="Search..."
              autoComplete="off"
              name="search"
              className="global-header-search-input"
            />
          </form>

          {/* Right: Auth area */}
          <div className="global-header-auth">
            {loading && (
              <span aria-live="polite">
                Checking session…
              </span>
            )}

            {!loading && !user && (
              <Link
                href="/login"
                aria-label="Log in"
                prefetch
                className="global-header-login-btn"
              >
                <FiLogIn aria-hidden="true" />
                <span>Log In</span>
              </Link>
            )}

            {!loading && user && (
              <div className="global-header-user-menu">
                {/* User pill button */}
                <button
                  type="button"
                  className="global-header-user-btn"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((s) => !s)}
                >
                  {/* Avatar or fallback initials */}
                  <span className="global-header-user-avatar" aria-hidden="true">
                    {initials}
                  </span>
                  <span
                    title={(
                      (user?.first_name ? user.first_name + " " : "") +
                      (user?.last_name ?? "")
                    ).trim()}
                  >
                    {(
                      (user?.first_name ? user.first_name + " " : "") +
                      (user?.last_name ?? "")
                    ).trim()}
                  </span>
                  <FiChevronDown aria-hidden="true" />
                </button>

                {/* User menu */}
                {menuOpen && (
                  <div
                    role="menu"
                    aria-label="User menu"
                    className="global-header-user-dropdown"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className="global-header-menu-item"
                      onClick={() => {
                        setMenuOpen(false);
                        setProfileModalOpen(true);
                      }}
                    >
                      Profile
                    </button>
                    <Link
                      href="/account/security"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="global-header-menu-item"
                    >
                      Security
                    </Link>
                    <Link
                      href="/billing"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="global-header-menu-item"
                    >
                      Billing
                    </Link>
                    <Link
                      href="/admin/utility/support/contact"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="global-header-menu-item"
                    >
                      Contact Support
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="global-header-menu-item"
                      style={{
                        cursor: signingOut ? "not-allowed" : "pointer",
                        opacity: signingOut ? 0.6 : 1
                      }}
                    >
                      <FiLogOut aria-hidden="true" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Siren button */}
            <Link
              href="/turkus/issues/add"
              aria-label="Raise Issue"
              className="global-header-siren-btn"
            >
              <FiAlertOctagon />
            </Link>
          </div>
        </div>
      </header>
      <Modal open={profileModalOpen} onClose={() => setProfileModalOpen(false)}>
        <MyProfileModal
          open={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
        />
      </Modal>
    </>
  );
}
