import React from "react";
import NavLinks from "./NavLinks.jsx";
import { Link } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';

function DesktopNavigation() {
  const { user, logout } = useAuth();

  return (
    <nav className="DesktopNavigation">
      <Link to={"/"} className="desktop-nav-logo">
        <h1>FairShare</h1>
      </Link>
      <NavLinks />
      {user ? (
        <div className="user-logout">
          <span>{user.username}</span>
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
      ) : (
        <div className="login-signup">
          <Link to="/sign-up">Sign Up</Link>
          <Link to="/login" className="desktop-login-button">Login</Link>
        </div>
      )}
    </nav>
  );
}

export default DesktopNavigation;
