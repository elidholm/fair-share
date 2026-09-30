import React from "react";
import NavLinks from "./NavLinks.jsx";
import { Link } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import { Alert, Button, LinkButton, Spinner } from "../../ui";

function DesktopNavigation() {
  const { user, authLoading, authError, logout, logoutError, logoutPending } = useAuth();

  return (
    <nav className="DesktopNavigation" aria-label="Main navigation">
      <Link to="/" className="desktop-nav-logo">
        <span>FairShare</span>
      </Link>
      <NavLinks />
      {authLoading ? (
        <Spinner label="Checking account" size="sm" />
      ) : user ? (
        <div className="user-logout">
          <span>{user.username}</span>
          <Button onClick={logout} loading={logoutPending} variant="destructive">Logout</Button>
        </div>
      ) : (
        <div className="login-signup">
          <LinkButton to="/sign-up" variant="plain">Sign Up</LinkButton>
          <LinkButton to="/login">Login</LinkButton>
        </div>
      )}
      {(logoutError || authError) && (
        <Alert tone="error" className="fs-nav-error">{logoutError || authError}</Alert>
      )}
    </nav>
  );
}

export default DesktopNavigation;
