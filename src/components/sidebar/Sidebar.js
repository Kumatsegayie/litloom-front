import React, { useState, useEffect, useRef, useCallback } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import ReactDOM from "react-dom";
import { useTranslation } from "react-i18next";
import {
  Home, FileText, BookOpen, Mic, Palette,
  Feather, Image, Camera, ChevronDown, Bell, PenLine
} from "lucide-react";
import "./Sidebar.css";

const Sidebar = ({ collapsed, mobileOpen, onCloseMobile }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [artworksOpen, setArtworksOpen] = useState(false);
  const artworksRef = useRef(null);
  const submenuRef = useRef(null);

  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0, maxHeight: 260 });

  const artworkActive =
    location.pathname.startsWith("/poems") ||
    location.pathname.startsWith("/paintings") ||
    location.pathname.startsWith("/photos");

  // Keep submenu closed after page navigation (requested behavior).
  useEffect(() => {
    setArtworksOpen(false);
  }, [location.pathname]);

  // Close submenu on click
  const handleSubmenuClick = useCallback(
    (path) => {
      setArtworksOpen(false);
      navigate(path);
      if (onCloseMobile) onCloseMobile();
    },
    [navigate, onCloseMobile]
  );

  // Click outside closes submenu
  const handleOutsideClick = useCallback(
    (e) => {
      const menuEl = artworksRef.current;
      const submenuEl = submenuRef.current;

      if (!menuEl) return;

      // If click is inside parent or submenu → ignore
      if (menuEl.contains(e.target)) return;
      if (submenuEl && submenuEl.contains(e.target)) return;

      setArtworksOpen(false);
    },
    []
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [handleOutsideClick]);

  const updateSubmenuPosition = useCallback(() => {
    if (!artworksRef.current) return;
    const rect = artworksRef.current.getBoundingClientRect();
    const desiredTop = rect.bottom + 6;
    const viewportPadding = 10;
    const availableBelow = Math.max(140, window.innerHeight - desiredTop - viewportPadding);
    const clampedTop = Math.min(
      Math.max(viewportPadding, desiredTop),
      Math.max(viewportPadding, window.innerHeight - 160)
    );

    setSubmenuPosition({
      top: clampedTop,
      left: rect.right + 8,
      maxHeight: availableBelow,
    });
  }, []);

  useEffect(() => {
    if (!artworksOpen) return;
    updateSubmenuPosition();

    const handleReposition = () => updateSubmenuPosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [artworksOpen, updateSubmenuPosition]);

  const toggleArtworks = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setArtworksOpen((prev) => !prev);
  };

  const handlePrimaryNavigate = useCallback(() => {
    setArtworksOpen(false);
    if (mobileOpen && onCloseMobile) onCloseMobile();
  }, [mobileOpen, onCloseMobile]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (mobileOpen) {
      const handleClickOutside = (e) => {
        if (e.target && typeof e.target.closest === "function" && e.target.closest("[data-sidebar-toggle='true']")) {
          return;
        }
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && !sidebar.contains(e.target)) {
          onCloseMobile();
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [mobileOpen, onCloseMobile]);

  // Submenu component
  const submenu = (
    <div
      ref={submenuRef}
      className="artwork-submenu"
      role="menu"
      aria-label="Artworks submenu"
      style={{
        position: "fixed",
        top: submenuPosition.top,
        left: submenuPosition.left,
        zIndex: 3000,
        maxHeight: submenuPosition.maxHeight,
        overflowY: "auto",
      }}
    >
      <div onClick={() => handleSubmenuClick("/poems")} className="submenu-item-wrapper">
        <SubItem
          to="/poems"
          icon={PenLine}
          label={t("Poems")}
          active={location.pathname.startsWith("/poems")}
        />
      </div>

      <div onClick={() => handleSubmenuClick("/paintings")} className="submenu-item-wrapper">
        <SubItem
          to="/paintings"
          icon={Image}
          label={t("Paintings")}
          active={location.pathname.startsWith("/paintings")}
        />
      </div>

      {/* Paintings removed */}

      <div onClick={() => handleSubmenuClick("/photos")} className="submenu-item-wrapper">
        <SubItem
          to="/photos"
          icon={Camera}
          label={t("Photography")}
          active={location.pathname.startsWith("/photos")}
        />
      </div>
    </div>
  );

  return (
    <>
      <div
        className={`sidebar-overlay ${mobileOpen ? "open" : ""}`}
        onClick={onCloseMobile}
      />

      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-links">
          <NavItem to="/" icon={Home} label={t("Home")} collapsed={collapsed} onNavigate={handlePrimaryNavigate} />
          <NavItem to="/articles" icon={FileText} label={t("Articles")} collapsed={collapsed} onNavigate={handlePrimaryNavigate} />
          <NavItem to="/blogs" icon={Feather} label={t("Blogs")} collapsed={collapsed} onNavigate={handlePrimaryNavigate} />
          <NavItem to="/books" icon={BookOpen} label={t("Books")} collapsed={collapsed} onNavigate={handlePrimaryNavigate} />
          <NavItem to="/podcasts" icon={Mic} label={t("Podcasts")} collapsed={collapsed} onNavigate={handlePrimaryNavigate} />

          <div className="sidebar-divider" />

          <div ref={artworksRef} className="artworks-section">
            <div
              className={`sidebar-link artwork-parent ${artworkActive ? "active" : ""} ${
                artworksOpen ? "expanded" : ""
              }`}
              onClick={toggleArtworks}
            >
              <Palette size={20} />
              {!collapsed && (
                <>
                  <span>{t("Artworks")}</span>
                  <ChevronDown
                    size={16}
                    className="artworks-chevron"
                    style={{
                      transform: artworksOpen ? "rotate(180deg)" : "rotate(0deg)",
                      marginLeft: "auto",
                    }}
                  />
                </>
              )}
            </div>

            {artworksOpen && ReactDOM.createPortal(submenu, document.body)}
          </div>
          <NavLink
            to="/subscribe"
            className={({ isActive }) => `sidebar-subscribe-special ${isActive ? "active" : ""}`}
            onClick={handlePrimaryNavigate}
          >
            <Bell size={18} />
            {!collapsed && <span>{t("Subscribe")}</span>}
          </NavLink>
        </div>

        <div className="sidebar-footer">
          <div className="footer-links-wrapper">
            <div className="footer-links">
              <span onClick={() => handleSubmenuClick("/about")}>{t("About Us")}</span>
              <span onClick={() => handleSubmenuClick("/contact")}>{t("Contact Us")}</span>
              <span onClick={() => handleSubmenuClick("/privacy")}>{t("Privacy Policy")}</span>
            </div>
          </div>
          <div className="footer-copy">
            <span>Litloom@{new Date().getFullYear()}</span>
            <span>All rights reserved.</span>
          </div>
        </div>
      </aside>
    </>
  );
};

const NavItem = ({ to, icon: Icon, label, collapsed, onNavigate }) => (
  <NavLink
    to={to}
    end={to === "/"}
    className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
    onClick={onNavigate}
  >
    <Icon size={20} />
    {!collapsed && <span>{label}</span>}
  </NavLink>
);

const SubItem = ({ to, icon: Icon, label, active }) => (
  <NavLink to={to} className={`sidebar-sublink ${active ? "active" : ""}`}>
    <Icon size={16} />
    <span>{label}</span>
  </NavLink>
);

export default Sidebar;
