import React, { useState } from "react";
import NavLinks from "./NavLinks.jsx";
import { Link } from "react-router-dom";
import { Menu, X } from "react-feather";

function MobileNavigation() {
  const hamburger = (
    <Menu
      className="HamburgerMenu"
      size="30px"
      onClick={ () => setClick(!click) }
    />
  );

  const close = (
    <X
      className="HamburgerMenu"
      size="30px"
      onClick={ () => setClick(!click) }
    />
  );

  function closeMenu() {
    setClick(false);
  }

  const [click, setClick] = useState(false);

  return (
    <nav className="MobileNavigation">
      <Link to={"/"} onClick={ () => closeMenu() }>
        <h1>FairShare</h1>
      </Link>
      { click ? close : hamburger }
      { click && <NavLinks isClicked={true} closeMenu={closeMenu} /> }
    </nav>
  );
}

export default MobileNavigation;
