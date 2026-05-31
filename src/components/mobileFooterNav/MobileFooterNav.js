import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Home,
  FileText,
  Feather,
  BookOpen,
  Mic,
  Palette,
  PenLine,
  Image,
  Camera,
  MoreHorizontal,
  Bell,
  Info,
  Mail,
  Shield,
} from "lucide-react";
import "./MobileFooterNav.css";

const MobileFooterNav = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [artworksOpen, setArtworksOpen] = useState(false);
  const [othersOpen, setOthersOpen] = useState(false);
  const artworksRef = useRef(null);
  const othersRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (artworksRef.current && artworksRef.current.contains(event.target)) {
        return;
      }
      if (othersRef.current && !othersRef.current.contains(event.target)) {
        setOthersOpen(false);
      }
      setArtworksOpen(false);
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const goTo = (path) => {
    setArtworksOpen(false);
    setOthersOpen(false);
    navigate(path);
  };

  const artworksActive =
    location.pathname.startsWith("/poems") ||
    location.pathname.startsWith("/paintings") ||
    location.pathname.startsWith("/photos");

  return (
    <nav className="mobile-footer-nav" aria-label="Mobile navigation">
      <MobileNavItem to="/articles" icon={FileText} label={t("Articles")} />
      <MobileNavItem to="/blogs" icon={Feather} label={t("Blogs")} />
      <MobileNavItem to="/books" icon={BookOpen} label={t("Books")} />
      <MobileNavItem to="/" icon={Home} label={t("Home")} end home />
      <MobileNavItem to="/podcasts" icon={Mic} label={t("Podcasts")} />
      <div className="mobile-artworks-wrapper" ref={artworksRef}>
        <button
          type="button"
          className={`mobile-footer-link mobile-artworks-btn ${artworksActive ? "active" : ""}`}
          onClick={() => {
            setOthersOpen(false);
            setArtworksOpen((prev) => !prev);
          }}
          aria-label={t("Artworks menu")}
        >
          <Palette size={18} />
        </button>

        {artworksOpen && (
          <div className="mobile-dropup-menu mobile-artworks-menu">
            <button type="button" onClick={() => goTo("/poems")}>
              <PenLine size={15} />
              <span>{t("Poems")}</span>
            </button>
            <button type="button" onClick={() => goTo("/paintings")}>
              <Image size={15} />
              <span>{t("Paintings")}</span>
            </button>
            <button type="button" onClick={() => goTo("/photos")}>
              <Camera size={15} />
              <span>{t("Photography")}</span>
            </button>
          </div>
        )}
      </div>
      <div className="mobile-others-wrapper" ref={othersRef}>
        <button
          type="button"
          className="mobile-footer-link mobile-others-btn"
          onClick={() => {
            setArtworksOpen(false);
            setOthersOpen((prev) => !prev);
          }}
          aria-label={t("Others menu")}
        >
          <MoreHorizontal size={18} />
        </button>

        {othersOpen && (
          <div className="mobile-dropup-menu mobile-others-menu">
            <button type="button" onClick={() => goTo("/subscribe")}>
              <Bell size={15} />
              <span>{t("Subscribe")}</span>
            </button>
            <button type="button" onClick={() => goTo("/about")}>
              <Info size={15} />
              <span>{t("About Us")}</span>
            </button>
            <button type="button" onClick={() => goTo("/contact")}>
              <Mail size={15} />
              <span>{t("Contact Us")}</span>
            </button>
            <button type="button" onClick={() => goTo("/privacy")}>
              <Shield size={15} />
              <span>{t("Privacy Policy")}</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

const MobileNavItem = ({ to, icon: Icon, label, end = false, home = false }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `mobile-footer-link ${home ? "mobile-footer-home" : ""} ${isActive ? "active" : ""}`
    }
    aria-label={label}
    title={label}
  >
    <Icon size={18} />
  </NavLink>
);

export default MobileFooterNav;
