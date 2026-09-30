import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import PropTypes from "prop-types";

function NavLinks({ isClicked, closeMenu }) {
  const { pathname } = useLocation();
  const homeActive = pathname === "/" || pathname === "/home";
  return (
    <div className="NavLinks">
      <ul id="nav-link-list">
        <li>
          <Link
            to="/home"
            aria-current={homeActive ? "page" : undefined}
            className={homeActive ? "active" : undefined}
            onClick={() => isClicked && closeMenu?.()}
          >Home</Link>
        </li>
        <li><NavLink to="/split-costs" onClick={() => isClicked && closeMenu?.()}>Split costs</NavLink></li>
        <li><NavLink to="/budget" onClick={() => isClicked && closeMenu?.()}>Budget</NavLink></li>
      </ul>
    </div>
  );
}

NavLinks.propTypes = {
  isClicked: PropTypes.bool,
  closeMenu: PropTypes.func,
};

export default NavLinks;
