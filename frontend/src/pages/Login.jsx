import React from "react";
import { Link } from "react-router-dom";

function Login() {
  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Welcome Back</h1>
        <form className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input type="text" autoCapitalize="none" autoCorrect="off" id="username" placeholder="Enter your username" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="Enter your password" required />
          </div>
          <button type="submit" className="login-button">
            Login
          </button>
        </form>
        <div className="login-footer">
          <p>Don&apos;t have an account? <Link to="/sign-up">Sign up</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
