import React from "react";
import "./PageDiscoverTitle.css";

const PageDiscoverTitle = ({ title = "Discover" }) => (
  <header className="page-discover-title-wrap">
    <h1 className="page-discover-title">{title}</h1>
  </header>
);

export default PageDiscoverTitle;
