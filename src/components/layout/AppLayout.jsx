import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { AiOutlineHome, AiFillHome } from "react-icons/ai";
import { MdOutlineVideoLibrary, MdVideoLibrary } from "react-icons/md";
import { IoChatbubbleOutline, IoChatbubble } from "react-icons/io5";
import { CgProfile } from "react-icons/cg";
import { RiUserFill } from "react-icons/ri";

const navItems = [
  { to: "/",        label: "Home",     Icon: AiOutlineHome,           ActiveIcon: AiFillHome },
  { to: "/shorts",  label: "Shorts",   Icon: MdOutlineVideoLibrary,   ActiveIcon: MdVideoLibrary },
  { to: "/messages",label: "Messages", Icon: IoChatbubbleOutline,     ActiveIcon: IoChatbubble },
  { to: "/profile", label: "Profile",  Icon: CgProfile,               ActiveIcon: RiUserFill },
];

export default function AppLayout() {
  return (
    <div style={styles.root}>
      <main style={styles.main}>
        <Outlet />
      </main>
      <nav style={styles.nav}>
        {navItems.map(({ to, label, Icon, ActiveIcon }) => (
          <NavLink key={to} to={to} end={to === "/"} style={({ isActive }) => ({
            ...styles.navItem,
            color: isActive ? "var(--color-nav-active)" : "var(--color-nav-inactive)",
          })}>
            {({ isActive }) => (
              <>
                {isActive ? <ActiveIcon size={24} /> : <Icon size={24} />}
                <span style={{
                  ...styles.navLabel,
                  fontWeight: isActive ? 700 : 400,
                }}>{label}</span>
                {isActive && <span style={styles.dot} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "var(--color-bg-primary)",
  },
  main: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    background: "var(--color-nav-bg)",
    borderTop: "1px solid var(--color-border)",
    paddingBottom: "env(safe-area-inset-bottom, 8px)",
    paddingTop: "10px",
    zIndex: 100,
  },
  navItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "3px",
    textDecoration: "none",
    transition: "color var(--transition-fast)",
    position: "relative",
    padding: "4px 12px",
  },
  navLabel: {
    fontSize: "10px",
    letterSpacing: "0.5px",
    fontFamily: "var(--font-body)",
  },
  dot: {
    position: "absolute",
    bottom: "-6px",
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    background: "var(--color-accent)",
  },
};
