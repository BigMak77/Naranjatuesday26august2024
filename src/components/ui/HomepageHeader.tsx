"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { useUser } from "@/lib/useUser";
import { supabase } from "@/lib/supabase-client";
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiShield,
  FiSettings,
  FiLogIn,
  FiLogOut,
  FiChevronDown,
  FiAlertOctagon,
  FiSearch,
} from "react-icons/fi";
import MyProfileModal from "@/components/user/MyProfileModal";
import Modal from "@/components/modal";

type NavLink = {
  href: string;
  label: string;
  icon: React.ReactElement;
  dropdown?: { href: string; label: string }[];
};

type GlobalHeaderProps = {
  logoPriority?: boolean;
  /** Override/extend the default quick links (shown when signed-in). */
  navLinks?: NavLink[];
  /** Make header background full-bleed but keep content centered. */
  fullBleed?: boolean;
};

export default function HomepageHeader({
  logoPriority = false,
  navLinks,
  fullBleed = true,
}: GlobalHeaderProps) {
  const { user, loading } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      setOpenDropdown(null);
      setMenuOpen(false);
    }
    if (openDropdown || menuOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [openDropdown, menuOpen]);

  const dashboardHref = useMemo(() => {
    if (!user || typeof user.access_level !== "string")
      return "/user/dashboard";
    switch (user.access_level.toLowerCase()) {
      case "admin":
        return "/admin/dashboard";
      case "manager":
        return "/manager/dashboard";
      case "user":
        return "/user/dashboard";
      default:
        return "/user/dashboard";
    }
  }, [user]);

  const links: NavLink[] = useMemo(
    () =>
      navLinks ?? [
        { href: dashboardHref, label: "Dashboard", icon: <FiHome style={{ color: '#fff', fontSize: 18 }} /> },
        { href: "/hr/people/", label: "HR", icon: <FiUsers style={{ color: '#fff', fontSize: 18 }} /> },
        {
          href: "/turkus",
          label: "Turkus",
          icon: <FiFileText style={{ color: '#fff', fontSize: 18 }} />,
          dropdown: [
            { href: "/turkus/audit", label: "Audit" },
            { href: "/turkus/tasks", label: "Tasks" },
            { href: "/turkus/issues", label: "Issues" },
            { href: "/turkus/documents", label: "Documents" },
          ],
        },
        { href: "/admin/incomplete", label: "Compliance", icon: <FiShield style={{ color: '#fff', fontSize: 18 }} /> },
      ],
    [navLinks, dashboardHref],
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
    await supabase.auth.signOut();
    // Optional: hard refresh or route to login
    // window.location.href = "/login";
  }

  // Add login handler
  async function handleSignIn() {
    setLoginLoading(true);
    try {
      window.location.href = "/homepage/login";
    } finally {
      // In case redirect fails, re-enable button after 2s
      setTimeout(() => setLoginLoading(false), 2000);
    }
  }

  return (
    <>
      <header className="global-header">
        <div className="global-header-inner">
          {/* Left: Logo */}
          <Link href="/" aria-label="Go to homepage" className="global-header-logo">
            <Image
              src="/logo2.png"
              alt="Naranja"
              width={220}
              height={86}
              sizes="(max-width: 768px) 130px, 220px"
              priority={logoPriority}
              className="global-header-logo-img"
            />
          </Link>

          {/* Center: Quick links, Search, User, Siren (signed-in only) */}
          {!loading && user && (
            <>
              <nav aria-label="Primary" className="global-header-nav">
                {links.map((l) =>
                  l.dropdown ? (
                    <div key={l.href} className="global-header-nav-dropdown">
                      <button
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={openDropdown === l.href}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === l.href ? null : l.href);
                        }}
                        className="global-header-nav-btn"
                      >
                        <span className="global-header-nav-icon">{l.icon}</span>
                        <span>{l.label}</span>
                        <FiChevronDown className="global-header-nav-chevron" />
                      </button>
                      {openDropdown === l.href && (
                        <div role="menu" className="global-header-nav-dropdown-menu">
                          {l.dropdown.map((d) => (
                            <Link
                              key={d.href}
                              href={d.href}
                              role="menuitem"
                              className="global-header-nav-dropdown-link"
                              prefetch
                              onClick={() => setOpenDropdown(null)}
                            >
                              {d.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="global-header-nav-link"
                      prefetch
                    >
                      <span className="global-header-nav-icon">{l.icon}</span>
                      <span>{l.label}</span>
                    </Link>
                  )
                )}
              </nav>

              <form
                role="search"
                aria-label="Site search"
                className="global-header-search-form"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="global-header-search-inner">
                  <span className="global-header-search-icon">
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
                </div>
              </form>

              <div className="global-header-user-area">
                <div className="global-header-user-pill-wrapper">
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen((s) => !s);
                    }}
                    className="global-header-user-pill"
                  >
                    <span className="global-header-user-pill-initials">{initials}</span>
                    <span className="global-header-user-pill-name" title={((user?.first_name ? user.first_name + " " : "") + (user?.last_name ?? "")).trim()}>
                      {((user?.first_name ? user.first_name + " " : "") + (user?.last_name ?? "")).trim()}
                    </span>
                    <FiChevronDown className="global-header-user-pill-chevron" />
                  </button>
                  {menuOpen && (
                    <div role="menu" aria-label="User menu" className="global-header-user-menu">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                          setProfileModalOpen(true);
                        }}
                        className="global-header-user-menu-btn"
                      >
                        Profile
                      </button>
                      <Link
                        href="/account/security"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="global-header-user-menu-link"
                      >
                        Security
                      </Link>
                      <Link
                        href="/billing"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="global-header-user-menu-link"
                      >
                        Billing
                      </Link>
                      <Link
                        href="/admin/utility/support/contact"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="global-header-user-menu-link"
                      >
                        Contact Support
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleSignOut}
                        className="global-header-user-menu-btn global-header-user-menu-signout"
                      >
                        <FiLogOut className="global-header-user-menu-signout-icon" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
                <a
                  className="global-header-siren-btn"
                  href="/turkus/issues/add"
                >
                  <FiAlertOctagon className="global-header-siren-icon" />
                </a>
              </div>
            </>
          )}

          {/* Right: Auth area (not signed-in) */}
          {!loading && !user && (
            <button
              className="global-header-login-btn"
              aria-label="Log in to your account"
              onClick={handleSignIn}
              type="button"
              disabled={loginLoading}
              tabIndex={0}
            >
              {loginLoading ? (
                <span className="global-header-login-spinner" aria-label="Logging in..." />
              ) : (
                <FiLogIn className="global-header-login-icon" />
              )}
              <span>
                {loginLoading ? "Logging in..." : "Log In"}
              </span>
            </button>
          )}
          {loading && (
            <span aria-live="polite" className="global-header-loading-text">
              Checking session…
            </span>
          )}
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
