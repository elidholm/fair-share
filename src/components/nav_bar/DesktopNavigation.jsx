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
      <button className="desktop-login-button">
        Login
      </button>
    </nav>
  )
}

export default DesktopNavigation;
