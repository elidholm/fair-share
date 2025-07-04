import React from "react";
import NavLinks from "./NavLinks.jsx";
import { Link } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';

function MobileNavigation() {
  const { user, logout } = useAuth();

  return (
    <nav className="MobileNavigation">
      <div className="mobile-nav-top-row">
        <Link to={"/"} className="mobile-nav-logo">
          <h1>FairShare</h1>
        </Link>
        {user ? (
          <div className="user-logout">
            <button onClick={logout} className="logout-button">Logout</button>
          </div>
        ) : (
          <div className="login-signup">
            <Link to="/sign-up">Sign Up</Link>
            <Link to="/login" className="mobile-login-button">Login</Link>
          </div>
        )}
      </div>
      <div className="mobile-nav-links-row">
        <NavLinks />
      </div>
    </nav>
  );
}

export default MobileNavigation;
