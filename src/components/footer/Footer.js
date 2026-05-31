import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer fade-in">
      <p>© {new Date().getFullYear()} Litloom. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
