import React from "react";
import DesktopNavigation from "./DesktopNavigation.jsx";
import MobileNavigation from "./MobileNavigation.jsx";

const NavBar = () => {
  return (
    <div className="NavBar">
      <DesktopNavigation />
      <MobileNavigation />
    </div>
  );
}

export default NavBar;
