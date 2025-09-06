"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
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
import styles from "@/components/ui/ProjectGlobalHeader.module.css";
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
  const [turkusDropdownOpen, setTurkusDropdownOpen] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const handleTurkusDropdown = () => setTurkusDropdownOpen((open) => !open);

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
        { href: "/hr/people/", label: "HR", icon: <FiUsers /> },
        {
          href: "/turkus",
          label: "Turkus",
          icon: <FiFileText />,
          dropdown: [
            { href: "/turkus/audit", label: "Audit" },
            { href: "/turkus/tasks", label: "Tasks" },
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
        className={`${styles.header} ${fullBleed ? styles.fullBleed : ""}`}
      >
        <div className={styles.row}>
          {/* Left: Logo */}
          <Link
            href="/"
            aria-label="Go to homepage"
            className={styles.logoLink}
          >
            <Image
              src="/logo2.png"
              alt="Naranja"
              width={220} // Larger logo width
              height={86} // Keep header height at 44px
              sizes="(max-width: 768px) 130px, 220px"
              priority={logoPriority}
              className={styles.logoImg}
              style={{ objectFit: "contain", height: "96px", width: "220px" }} // Ensure logo fits within header height
            />
          </Link>

          {/* Center: Quick links (signed-in only) */}
          {!loading && user && (
            <nav className={styles.nav} aria-label="Primary">
              {links.map((l) =>
                l.dropdown ? (
                  <div
                    key={l.href}
                    className={styles.navItemDropdown}
                    style={{ position: "relative" }}
                  >
                    <button
                      className={styles.navItem}
                      type="button"
                      style={{
                        fontFamily: "inherit",
                        fontWeight: "inherit",
                        color: "inherit",
                        background: "none",
                        border: "none",
                        padding: 0,
                      }}
                      aria-haspopup="menu"
                      aria-expanded={turkusDropdownOpen}
                      onClick={handleTurkusDropdown}
                    >
                      <span className={styles.navIcon} aria-hidden="true">
                        {l.icon}
                      </span>
                      <span className={styles.navText}>{l.label}</span>
                      <FiChevronDown
                        className={styles.chev}
                        aria-hidden="true"
                      />
                    </button>
                    {turkusDropdownOpen && (
                      <div
                        className={styles.menu}
                        role="menu"
                        style={{
                          top: "100%",
                          left: 0,
                          minWidth: 180,
                          position: "absolute",
                          zIndex: 3002,
                        }}
                      >
                        {l.dropdown.map((d) => (
                          <Link
                            key={d.href}
                            href={d.href}
                            className={styles.menuItem}
                            role="menuitem"
                            prefetch
                            onClick={() => setTurkusDropdownOpen(false)}
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
                    className={styles.navItem}
                    prefetch
                  >
                    <span className={styles.navIcon} aria-hidden="true">
                      {l.icon}
                    </span>
                    <span className={styles.navText}>{l.label}</span>
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
                <span className={styles.searchIcon} aria-hidden="true">
                  <FiSearch />
                </span>
                <input
                  id="global-header-search"
                  className={styles.searchBar}
                  type="search"
                  placeholder="Search..."
                  autoComplete="off"
                  name="search"
                  style={{ marginLeft: 0 }}
                />
              </div>
            </form>
          )}

          {/* Right: Auth area */}
          <div className={styles.right}>
            {loading && (
              <span className={styles.status} aria-live="polite">
                Checking session…
              </span>
            )}

            {!loading && !user && (
              <button
                className={`neon-btn neon-btn-orange ${styles.loginBtn}`}
                aria-label="Log in to your account"
                onClick={handleSignIn}
                type="button"
                disabled={loginLoading}
                tabIndex={0}
                style={{
                  minWidth: 100,
                  position: "relative",
                  background: "var(--orange, #ff8800)",
                  color: "#fff",
                  border: "none",
                  boxShadow: "0 0 8px 2px rgba(255,136,0,0.25)",
                  fontWeight: 600,
                }}
              >
                {loginLoading ? (
                  <span
                    className="spinner"
                    aria-label="Logging in..."
                    style={{ marginRight: 8 }}
                  />
                ) : (
                  <FiLogIn aria-hidden="true" style={{ marginRight: 8 }} />
                )}
                <span className={styles.hideSm}>
                  {loginLoading ? "Logging in..." : "Log In"}
                </span>
              </button>
            )}

            {!loading && user && (
              <div className={styles.userBlock}>
                {/* User pill */}
                <button
                  type="button"
                  className={styles.userPill}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((s) => !s)}
                >
                  {/* Avatar or fallback initials */}
                  <span className={styles.avatarContainer}>
                    <span className={styles.avatarFallback} aria-hidden="true">
                      {initials}
                    </span>
                    <span
                      className={styles.userName}
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
                  <FiChevronDown className={styles.chev} aria-hidden="true" />
                </button>

                {/* User menu */}
                {menuOpen && (
                  <div
                    className={styles.menu}
                    role="menu"
                    aria-label="User menu"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className={styles.menuItem}
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
                      className={styles.menuItem}
                      onClick={() => setMenuOpen(false)}
                    >
                      Security
                    </Link>
                    <Link
                      href="/billing"
                      role="menuitem"
                      className={styles.menuItem}
                      onClick={() => setMenuOpen(false)}
                    >
                      Billing
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      className={styles.menuItemDanger}
                      onClick={handleSignOut}
                    >
                      <FiLogOut aria-hidden="true" />
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
              >
                <FiAlertOctagon />
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
