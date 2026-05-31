import React from "react";
import { ArrowLeft } from "lucide-react";
import "./contentActions.css";

const FixedBackButton = ({ onClick, ariaLabel = "Back" }) => (
  <button
    type="button"
    className="content-fixed-back"
    onClick={onClick}
    aria-label={ariaLabel}
    title={ariaLabel}
  >
    <ArrowLeft size={20} />
  </button>
);

export default FixedBackButton;
