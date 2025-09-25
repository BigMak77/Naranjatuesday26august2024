"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useContext } from "react";
import { useUser } from "@/lib/useUser";
import { supabase } from "@/lib/supabase-client";
import {
  FiHome,
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
        { href: dashboardHref, label: "Dashboard", icon: <FiHome /> },
        {
          label: "People & Roles",
          icon: <FiUsers />,
          dropdown: [
            { href: "/hr/people/", label: "People" },
            { href: "/admin/roles/add", label: "Roles" },
            { href: "/admin/org-chart/", label: "Org Chart" },
            { href: "/admin/role-profiles/", label: "Role Profiles" },
            { href: "/admin/utility/", label: "Utilities" },
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
      <header
        className="global-header"
        style={{
          width: "100%",
          background: "linear-gradient(118deg in oklab, #05363a 0%, #0a706a 48%, #16cbcf 100%)",
          borderBottom: "1px solid #eaeaea",
          boxSizing: "border-box",
          zIndex: 3000,
        }}
      >
        <div
          className="global-header-row"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            minHeight: "96px",
            boxSizing: "border-box",
          }}
        >
          {/* Left: Logo */}
          <Link
            href="/"
            aria-label="Go to homepage"
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              marginRight: "12px",
            }}
          >
            <Image
              src="/logo2.png"
              alt="Naranja"
              width={220}
              height={86}
              priority={logoPriority}
              style={{
                objectFit: "contain",
                height: "96px",
                width: "220px",
                display: "block",
              }}
            />
          </Link>

          {/* Center: Quick links (signed-in) */}
          {!loading && user && (
            <nav
              aria-label="Primary"
              style={{
                display: "flex",
                gap: "8px", // Space between nav items
                alignItems: "center",
                flex: 1,
                justifyContent: "left",
              }}
            >
              {links
                .filter((l) => l.dropdown || l.href)
                .map((l) =>
                  l.dropdown ? (
                    <div
                      key={l.label}
                      className="global-header-dropdown"
                      style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                      }}
                    >
                      <button
                        type="button"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontFamily: "inherit",
                          fontWeight: 500,
                          background: "none",
                          border: "none",
                          padding: "10px 18px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          transition: "background 0.2s",
                          color: "#fff", // force white text for dropdown button
                          fontSize: "17px", // match nav link size
                        }}
                        aria-haspopup="menu"
                        aria-expanded={openDropdown === l.label}
                        onClick={() => setOpenDropdown(openDropdown === l.label ? null : l.label)}
                      >
                        <span style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden="true">
                          {l.icon && React.cloneElement(l.icon, { style: { fontSize: "18px", color: "#fff" } })}
                        </span>
                        <span style={{ fontSize: "17px", fontWeight: 500 }}>{l.label}</span>
                        <FiChevronDown style={{ fontSize: "18px", width: "20px", height: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff" }} aria-hidden="true" />
                      </button>
                      {openDropdown === l.label && (
                        <div
                          role="menu"
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            minWidth: "180px",
                            background: "#fa7a20", // orange background
                            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                            borderRadius: "8px",
                            zIndex: 3002,
                            marginTop: "8px",
                            padding: "8px 0",
                          }}
                        >
                          {l.dropdown.map((d) => (
                            <Link
                              key={d.href}
                              href={d.href}
                              role="menuitem"
                              prefetch
                              className={d.className || "global-header-link"}
                              style={{
                                display: "block",
                                padding: "10px 24px",
                                textDecoration: "none",
                                fontWeight: 400,
                                fontSize: "16px", // slightly larger for dropdown
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                transition: "background 0.2s",
                                color: "#fff", // white text
                              }}
                              onClick={() => setOpenDropdown(null)}
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
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          textDecoration: "none",
                          fontWeight: 500,
                          fontSize: "17px", // slightly larger for visibility
                          padding: "10px 18px", // more touch area
                          borderRadius: "8px",
                          transition: "background 0.2s",
                          color: "#fff", // force white text for nav links
                        }}
                      >
                        <span style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden="true">
                          {l.icon && React.cloneElement(l.icon, { style: { fontSize: "18px", color: "#fff" } })}
                        </span>
                        <span style={{ fontSize: "17px", fontWeight: 500 }}>{l.label}</span>
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
            style={{
              display: "flex", // ensure icon and input are inline
              alignItems: "center", // vertical alignment
              gap: "8px", // space between icon and input
              margin: 0,
              padding: 0,
              border: "none",
              background: "none",
            }}
            onSubmit={(e) => e.preventDefault()}
          >
            <span className="global-header-search-icon" aria-hidden="true" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FiSearch style={{ fontSize: "18px", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }} />
            </span>
            <input
              id="global-header-search"
              type="search"
              placeholder="Search..."
              autoComplete="off"
              name="search"
              className="global-header-search-input"
              style={{
                display: "inline-block",
                verticalAlign: "middle",
                margin: 0,
              }}
            />
          </form>

          {/* Right: Auth area */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              minWidth: "220px",
              justifyContent: "flex-end",
            }}
          >
            {loading && (
              <span style={{ fontSize: "15px" }} aria-live="polite">
                Checking session…
              </span>
            )}

            {!loading && !user && (
              <Link
                href="/login"
                aria-label="Log in"
                prefetch
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#e94f4f",
                  borderRadius: "8px",
                  padding: "10px 18px",
                  fontWeight: 500,
                  fontSize: "17px",
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(233,79,79,0.08)",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.2s",
                  color: "#fff", // force white text
                }}
              >
                <FiLogIn aria-hidden="true" style={{ fontSize: "18px", width: "20px", height: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff" }} />
                <span style={{ display: "inline-block", fontSize: "17px", fontWeight: 500 }}>Log In</span>
              </Link>
            )}

            {!loading && user && (
              <div style={{ position: "relative" }} className="global-header-user-menu">
                {/* User pill button - update background and border to match pill */}
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((s) => !s)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "#fa7a20", // orange background for full button
                    borderRadius: "24px",
                    padding: "0.5rem 0.5rem", // reduced padding inside the button
                    border: "2px solid #fff", // white border for full button
                    cursor: "pointer",
                    fontWeight: 500,
                    fontSize: "16px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                    color: "#fff",
                  }}
                >
                  {/* Avatar or fallback initials */}
                  <span
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "#fa7a20",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "12px", // reduced to 12px
                      marginRight: "8px",
                      color: "#fff",
                      border: "2px solid #fff",
                      boxSizing: "border-box",
                    }}
                    aria-hidden="true"
                  >
                    {initials}
                  </span>
                  <span
                    style={{ fontWeight: 500, fontSize: "12px", color: "#fff" }} // reduced to 12px
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
                  <FiChevronDown style={{ fontSize: "18px", width: "20px", height: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff" }} aria-hidden="true" />
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
                      disabled={signingOut}
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
                        cursor: signingOut ? "not-allowed" : "pointer",
                        borderRadius: "4px",
                        opacity: signingOut ? 0.6 : 1,
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

            {/* Siren button */}
            <Link
              href="/turkus/issues/"
              aria-label="Raise Issue"
              className="global-header-siren-btn" // use global class for styling
              style={{
                // Remove most inline styles, keep only what is unique
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <FiAlertOctagon style={{ fontSize: "18px", width: "20px", height: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff" }} />
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
