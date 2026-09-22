import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from "prop-types";

function NavLinks({ isClicked, closeMenu }) {
  return(
    <nav className="NavLinks">
      <ul id="nav-link-list">
        <li onClick={ () => isClicked && closeMenu() }>
          <Link to="/home">Home</Link>
        </li>
        <li onClick={ () => isClicked && closeMenu() }>
          <Link to="/split-costs">Split costs</Link>
        </li>
        <li onClick={ () => isClicked && closeMenu() }>
          <Link to="/budget">Budget</Link>
        </li>
      </ul>
    </nav>
  )
}

NavLinks.propTypes = {
  isClicked: PropTypes.bool,
  closeMenu: PropTypes.func,
};

export default NavLinks;
