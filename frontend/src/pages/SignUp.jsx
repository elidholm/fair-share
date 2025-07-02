import React from "react";
import { Form, useActionData } from "react-router-dom";

function SignUp() {
  const actionData = useActionData();

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h1>Sign Up</h1>
        <Form className="signup-form" method="POST">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" placeholder="Enter email" required />
          </div>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input type="text" autoCapitalize="none" autoCorrect="off" id="username" autoComplete="username" placeholder="Enter username" required />
          </div>
          <div className="form-group">
            <label htmlFor="password1">Password</label>
            <input type="password" id="password1" name="password1" autoComplete="new-password" placeholder="Enter password" required />
          </div>
          <div className="form-group">
            <label htmlFor="password2">Password (Confirm)</label>
            <input type="password" id="password2" name="password2" autoComplete="new-password" placeholder="Confirm password" required />
          </div>
          <button type="submit" className="signup-button">
            Submit
          </button>
          {actionData?.error && (
            <div className="error-message">
              {actionData.error}
            </div>
          )}
        </Form>
      </div>
    </div>
  );
}

export default SignUp;
