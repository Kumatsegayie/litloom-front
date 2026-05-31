import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { navigateBackOr } from "../../utils/navigation";

const PageBackButton = ({ fallbackPath = "/", label = "Back", className = "" }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={`page-back-btn ${className}`.trim()}
      onClick={() => navigateBackOr(navigate, fallbackPath)}
      aria-label={label}
    >
      <ArrowLeft size={18} />
      <span>{label}</span>
    </button>
  );
};

export default PageBackButton;
