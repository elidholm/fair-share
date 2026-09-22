import React, { useEffect, useState } from "react";
import DesktopNavigation from "./DesktopNavigation.jsx";
import MobileNavigation from "./MobileNavigation.jsx";

const NavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`NavBar${isScrolled ? " is-scrolled" : ""}`}>
      <DesktopNavigation />
      <MobileNavigation />
    </div>
  );
}

export default NavBar;
