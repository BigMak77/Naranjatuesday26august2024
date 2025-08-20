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
  FiMenu,
} from "react-icons/fi";
import styles from "@/components/ui/ProjectGlobalHeader.module.css";
import MyProfileModal from "@/components/user/MyProfileModal";
import Modal from "@/components/modal";

type NavLink = {
  href: string;
  label: string;
  icon: React.ReactElement;
};

type GlobalHeaderProps = {
  logoPriority?: boolean;
  /** Override/extend the default quick links (shown when signed-in). */
  navLinks?: NavLink[];
  /** Show the second row (e.g. breadcrumbs/tabs) under the main bar. */
  secondRow?: React.ReactNode;
  /** Make header background full-bleed but keep content centered. */
  fullBleed?: boolean;
};

export default function GlobalHeader({
  logoPriority = false,
  navLinks,
  secondRow,
  fullBleed = true,
}: GlobalHeaderProps) {
  const { user, loading } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const dashboardHref = useMemo(() => {
    if (!user || typeof user.access_level !== "string") return "/user/dashboard";
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
        { href: "/hr/people/", label: "HR", icon: <FiUsers /> }, // Updated link to /hr/
        { href: "/admin/documents", label: "Documents", icon: <FiFileText /> },
        { href: "/compliance", label: "Compliance", icon: <FiShield /> },
        { href: "/settings", label: "Settings", icon: <FiSettings /> },
      ],
    [navLinks, dashboardHref]
  );

  const initials = useMemo(() => {
    const name =
      ((user?.first_name ? user.first_name + " " : "") +
        (user?.last_name ?? "")).trim();
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

  return (
    <>
      <header className={`${styles.header} ${fullBleed ? styles.fullBleed : ""}`}>
        <div className={styles.row}>
          {/* Left: Logo */}
          <Link href="/" aria-label="Go to homepage" className={styles.logoLink}>
            <Image
              src="/logo2.png"
              alt="Naranja"
              width={220} // Larger logo width
              height={86} // Keep header height at 44px
              sizes="(max-width: 768px) 130px, 220px"
              priority={logoPriority}
              className={styles.logoImg}
              style={{ objectFit: 'contain', height: '96px', width: '220px' }} // Ensure logo fits within header height
            />
          </Link>

          {/* Center: Quick links (signed-in) */}
          {!loading && user && (
            <nav className={styles.nav} aria-label="Primary">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className={styles.navItem} prefetch>
                  <span className={styles.navIcon} aria-hidden="true">
                    {l.icon}
                  </span>
                  <span className={styles.navText}>{l.label}</span>
                </Link>
              ))}
            </nav>
          )}

          {/* Right: Auth area */}
          <div className={styles.right}>
            {loading && (
              <span className={styles.status} aria-live="polite">
                Checking session…
              </span>
            )}

            {!loading && !user && (
              <Link href="/login" className={styles.loginBtn} aria-label="Log in" prefetch>
                <FiLogIn aria-hidden="true" />
                <span className={styles.hideSm}>Log In</span>
              </Link>
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
                      title={((user?.first_name ? user.first_name + " " : "") + (user?.last_name ?? "")).trim()}
                    >
                      {((user?.first_name ? user.first_name + " " : "") + (user?.last_name ?? "")).trim()}
                    </span>
                  </span>
                  <FiChevronDown className={styles.chev} aria-hidden="true" />
                </button>

                {/* User menu */}
                {menuOpen && (
                  <div className={styles.menu} role="menu" aria-label="User menu">
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
                    <Link href="/account/security" role="menuitem" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                      Security
                    </Link>
                    <Link href="/billing" role="menuitem" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                      Billing
                    </Link>
                    <button type="button" role="menuitem" className={styles.menuItemDanger} onClick={handleSignOut}>
                      <FiLogOut aria-hidden="true" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu trigger: shows primary nav in a sheet */}
            {!loading && user && (
              <button
                type="button"
                aria-label="Open menu"
                className={styles.menuBtn}
                onClick={() => document.documentElement.classList.toggle("nav-open")}
              >
                <FiMenu aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Second row (optional) */}
        {secondRow && (
          <div className={styles.secondRow} role="region" aria-label="Secondary">
            {secondRow}
          </div>
        )}

        {/* Mobile sheet (uses same links) */}
        <div className={styles.mobileSheet} aria-hidden="true">
          <nav className={styles.mobileNav} aria-label="Mobile">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={styles.mobileItem} onClick={() => document.documentElement.classList.remove("nav-open")} prefetch>
                <span className={styles.mobileIcon} aria-hidden="true">
                  {l.icon}
                </span>
                <span>{l.label}</span>
              </Link>
            ))}
            <div className={styles.mobileDivider} />
            <Link href="/profile" className={styles.mobileItem} onClick={() => document.documentElement.classList.remove("nav-open")}>
              Profile
            </Link>
            <button type="button" className={styles.mobileItemDanger} onClick={handleSignOut}>
              <FiLogOut aria-hidden="true" />
              Sign out
            </button>
          </nav>
        </div>

        {/* Add route rendering logic for /profile */}
        {/* If current route is /profile, render <MyProfile /> */}
      </header>
      <Modal open={profileModalOpen} onClose={() => setProfileModalOpen(false)}>
        <MyProfileModal open={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
      </Modal>
    </>
  );
}
