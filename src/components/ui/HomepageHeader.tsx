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
      <header
        style={{
          width: "100%",
          background: "linear-gradient(90deg, #1a237e 0%, #00bcd4 100%)",
          boxShadow: "0 2px 16px 0 rgba(0,0,0,0.08)",
          padding: fullBleed ? "0 0" : "0 32px",
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: 1440,
          margin: "0 auto",
          padding: "0 32px",
          height: 86,
        }}>
          {/* Left: Logo */}
          <Link href="/" aria-label="Go to homepage" style={{ display: "flex", alignItems: "center" }}>
            <Image
              src="/logo2.png"
              alt="Naranja"
              width={220}
              height={86}
              sizes="(max-width: 768px) 130px, 220px"
              priority={logoPriority}
              style={{ objectFit: "contain", height: "96px", width: "220px" }}
            />
          </Link>

          {/* Center: Quick links (signed-in only) */}
          {!loading && user && (
            <nav aria-label="Primary" style={{ display: "flex", gap: "1.5rem" }}>
              {links.map((l) =>
                l.dropdown ? (
                  <div key={l.href} style={{ position: "relative" }}>
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={openDropdown === l.href}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdown(openDropdown === l.href ? null : l.href);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#fff",
                        font: "inherit",
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        padding: 0,
                        fontWeight: 600,
                        fontSize: "1rem",
                      }}
                    >
                      <span style={{ marginRight: 6, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>{l.icon}</span>
                      <span>{l.label}</span>
                      <FiChevronDown style={{ marginLeft: 6, color: "#fff", fontSize: 18 }} />
                    </button>
                    {openDropdown === l.href && (
                      <div
                        role="menu"
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          minWidth: 180,
                          background: "#ff8800",
                          color: "#fff",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          zIndex: 3002,
                          borderRadius: 8,
                          padding: "0.5rem 0",
                        }}
                      >
                        {l.dropdown.map((d) => (
                          <Link
                            key={d.href}
                            href={d.href}
                            role="menuitem"
                            style={{
                              display: "block",
                              padding: "0.5rem 1.5rem",
                              color: "#fff",
                              textDecoration: "none",
                              fontSize: "1rem",
                              fontWeight: 500,
                            }}
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
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      color: "#fff",
                      textDecoration: "none",
                      fontSize: "1rem",
                      fontWeight: 600,
                      padding: "0.5rem 1rem",
                    }}
                    prefetch
                  >
                    <span style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>{l.icon}</span>
                    <span>{l.label}</span>
                  </Link>
                )
              )}
            </nav>
          )}

          {/* Search Bar (signed-in only) */}
          {!loading && user && (
            <form
              role="search"
              aria-label="Site search"
              style={{ marginLeft: 24, marginRight: 24 }}
              onSubmit={(e) => e.preventDefault()}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ marginRight: 8, color: "#fff", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FiSearch style={{ color: "#fff", fontSize: 18 }} />
                </span>
                <input
                  id="global-header-search"
                  type="search"
                  placeholder="Search..."
                  autoComplete="off"
                  name="search"
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: 6,
                    border: "2px solid #00bcd4",
                    fontSize: "1rem",
                    background: "#222",
                    color: "#fff",
                    boxShadow: "0 0 8px 2px #00fff7",
                  }}
                />
              </div>
            </form>
          )}

          {/* Right: Auth area */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {loading && (
              <span aria-live="polite" style={{ color: "#fff" }}>
                Checking session…
              </span>
            )}

            {!loading && !user && (
              <button
                className="neon-btn neon-btn-orange"
                aria-label="Log in to your account"
                onClick={handleSignIn}
                type="button"
                disabled={loginLoading}
                tabIndex={0}
                style={{
                  minWidth: 100,
                  background: "var(--orange, #ff8800)",
                  color: "#fff",
                  border: "none",
                  boxShadow: "0 0 8px 2px rgba(255,136,0,0.25)",
                  fontWeight: 600,
                  padding: "0.5rem 1.5rem",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "1rem",
                }}
              >
                {loginLoading ? (
                  <span
                    className="spinner"
                    aria-label="Logging in..."
                    style={{ marginRight: 8 }}
                  />
                ) : (
                  <FiLogIn aria-hidden="true" style={{ marginRight: 8, color: "#fff", fontSize: 18 }} />
                )}
                <span>
                  {loginLoading ? "Logging in..." : "Log In"}
                </span>
              </button>
            )}

            {!loading && user && (
              <div style={{ position: "relative" }}>
                {/* User pill */}
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen((s) => !s);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#ff8800",
                    border: "2px solid #fff",
                    borderRadius: 20,
                    padding: "0.15rem 0.75rem",
                    cursor: "pointer",
                    font: "inherit",
                    boxShadow: "0 0 8px 2px #ff8800",
                  }}
                >
                  {/* Avatar or fallback initials */}
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        background: "#ff8800",
                        color: "#fff",
                        borderRadius: "50%",
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        border: "2px solid #fff",
                        boxShadow: "0 0 8px 2px #ff8800",
                      }}
                      aria-hidden="true"
                    >
                      {initials}
                    </span>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "1rem",
                        color: "#fff",
                      }}
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
                  </span>
                  <FiChevronDown style={{ marginLeft: 8, color: "#fff", fontSize: 18 }} aria-hidden="true" />
                </button>

                {/* User menu */}
                {menuOpen && (
                  <div
                    role="menu"
                    aria-label="User menu"
                    style={{
                      position: "absolute",
                      top: "110%",
                      right: 0,
                      minWidth: "180px",
                      background: "#fa7a20", // orange background
                      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                      borderRadius: "8px",
                      zIndex: 3002,
                      marginTop: "8px",
                      padding: "8px 0",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        setProfileModalOpen(true);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px 24px",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        fontWeight: 400,
                        fontSize: "16px",
                        cursor: "pointer",
                        borderRadius: "4px",
                        transition: "background 0.2s",
                        color: "#fff", // white text
                      }}
                    >
                      Profile
                    </button>
                    <Link
                      href="/account/security"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: "block",
                        padding: "10px 24px",
                        textDecoration: "none",
                        fontWeight: 400,
                        fontSize: "16px",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        borderRadius: "4px",
                        transition: "background 0.2s",
                        color: "#fff", // white text
                      }}
                    >
                      Security
                    </Link>
                    <Link
                      href="/billing"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: "block",
                        padding: "10px 24px",
                        textDecoration: "none",
                        fontWeight: 400,
                        fontSize: "16px",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        borderRadius: "4px",
                        transition: "background 0.2s",
                        color: "#fff", // white text
                      }}
                    >
                      Billing
                    </Link>
                    <Link
                      href="/admin/utility/support/contact"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: "block",
                        padding: "10px 24px",
                        textDecoration: "none",
                        fontWeight: 400,
                        fontSize: "16px",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        borderRadius: "4px",
                        transition: "background 0.2s",
                        color: "#fff", // white text
                      }}
                      className="global-header-link"
                    >
                      Contact Support
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        width: "100%",
                        padding: "10px 24px",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        fontWeight: 500,
                        fontSize: "16px",
                        cursor: "pointer",
                        borderRadius: "4px",
                        transition: "background 0.2s",
                        color: "#fff", // white text
                      }}
                    >
                      <FiLogOut aria-hidden="true" style={{ fontSize: "18px", width: "20px", height: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff" }} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Siren button (signed-in only) */}
            {!loading && user && (
              <a
                className="neon-btn neon-btn-danger neon-btn-square"
                href="/turkus/issues/add"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  background: "#d32f2f",
                  color: "#fff",
                  borderRadius: "50%",
                  fontSize: "1.3rem",
                  boxShadow: "0 0 8px 2px rgba(211,47,47,0.15)",
                }}
              >
                <FiAlertOctagon style={{ color: "#fff", fontSize: 18 }} />
              </a>
            )}
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
