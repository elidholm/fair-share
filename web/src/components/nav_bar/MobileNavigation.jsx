import React from "react";
import NavLinks from "./NavLinks.jsx";
import { Link } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import { Alert, Button, LinkButton, Spinner } from "../../ui";

function MobileNavigation() {
  const { user, authLoading, authError, logout, logoutError, logoutPending } = useAuth();

  return (
    <nav className="MobileNavigation" aria-label="Main navigation">
      <div className="mobile-nav-top-row">
        <Link to="/" className="mobile-nav-logo">
          <span>FairShare</span>
        </Link>
        {authLoading ? (
          <Spinner label="Checking account" size="sm" />
        ) : user ? (
          <div className="user-logout">
            <Button onClick={logout} loading={logoutPending} variant="destructive" size="sm">Logout</Button>
          </div>
        ) : (
          <div className="login-signup">
            <LinkButton to="/sign-up" variant="plain" size="sm">Sign Up</LinkButton>
            <LinkButton to="/login" size="sm">Login</LinkButton>
          </div>
        )}
      </div>
      {(logoutError || authError) && (
        <Alert tone="error" className="fs-nav-error">{logoutError || authError}</Alert>
      )}
      <div className="mobile-nav-links-row">
        <NavLinks />
      </div>
    </nav>
  );
}

export default MobileNavigation;
