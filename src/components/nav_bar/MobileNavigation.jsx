import React from "react";
import NavLinks from "./NavLinks.jsx";
import { Link } from "react-router-dom";

function MobileNavigation() {
  return (
    <nav className="MobileNavigation">
      <div className="mobile-nav-top-row">
        <Link to={"/"} className="mobile-nav-logo">
          <h1>FairShare</h1>
        </Link>
        <button className="mobile-login-button">
          Login
        </button>
      </div>
      <div className="mobile-nav-links-row">
        <NavLinks />
      </div>
    </nav>
  );
}

export default MobileNavigation;
