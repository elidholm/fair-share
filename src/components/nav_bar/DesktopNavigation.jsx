import React from "react";
import NavLinks from "./NavLinks.jsx";
import { Link } from "react-router-dom";

function DesktopNavigation() {
  return(
    <nav className="DesktopNavigation">
      <Link to={"/"} className="desktop-nav-logo">
        <h1>FairShare</h1>
      </Link>
      <NavLinks />
      <Link to="/login" className="desktop-login-button">
        Login
      </Link>
    </nav>
  )
}

export default DesktopNavigation;
