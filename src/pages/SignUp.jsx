import React from "react";

function SignUp() {
  return (
    <div className="signup-container">
      <div className="signup-card">
        <h1>Sign Up</h1>
        <form className="signup-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" placeholder="Enter email" required />
          </div>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input type="text" autoCapitalize="none" autoCorrect="off" id="username" placeholder="Enter username" required />
          </div>
          <div className="form-group">
            <label htmlFor="password1">Password</label>
            <input type="password" id="password1" name="password1" placeholder="Enter password" required />
          </div>
          <div className="form-group">
            <label htmlFor="password2">Password (Confirm)</label>
            <input type="password" id="password2" name="password2" placeholder="Confirm password" required />
          </div>
          <button type="submit" className="signup-button">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignUp;
