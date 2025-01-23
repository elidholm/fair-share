import React from "react";
import NavLinks from "./NavLinks.jsx";
import { Link } from "react-router-dom";

const DesktopNavigation = () => {
  return(
    <nav className="DesktopNavigation">
      <Link to={"/"}>
        <h1>FairShare</h1>
      </Link>
      <NavLinks />
    </nav>
  )
}

export default DesktopNavigation;
