import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, TextField } from "../ui";
import "./SignUp.scss";

function SignUp() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const passwordsMismatch = confirmTouched && confirmPassword.length > 0 && password !== confirmPassword;

  const handleConfirmChange = (e) => {
    setConfirmPassword(e.target.value);
    setConfirmTouched(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setConfirmTouched(true);

    if (password !== confirmPassword) {
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
        credentials: "include",
      });

      if (!response || typeof response.ok !== "boolean") {
        throw new Error("Invalid registration response");
      }
      if (!response.ok) {
        let data = {};
        try {
          data = await response.json();
        } catch {
          // Ignore malformed/empty error bodies and fall back to the default message.
        }
        throw new Error(data.error || "Registration failed");
      }

      // Registration successful, redirect to login
      navigate("/login");
    } catch (err) {
      // A rejected fetch (offline, DNS failure, etc.) surfaces as a TypeError,
      // distinct from an API error response which already has a useful message.
      setError(err instanceof TypeError ? "Unable to reach the server. Please try again." : err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup">
      <Card as="section" className="signup__card" material="thick" padding="lg">
        <h1>Sign Up</h1>
        <form className="signup__form" onSubmit={handleSubmit}>
          <TextField
            label="Email Address"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            required
          />
          <TextField
            label="Username"
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            placeholder="Enter username"
            required
          />
          <TextField
            label="Password"
            id="password1"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="Enter password"
            required
          />
          <TextField
            label="Password (Confirm)"
            id="password2"
            type="password"
            value={confirmPassword}
            onChange={handleConfirmChange}
            onBlur={() => setConfirmTouched(true)}
            error={passwordsMismatch ? "Passwords don't match" : undefined}
            autoComplete="new-password"
            placeholder="Confirm password"
            required
          />
          {error && (
            <Alert tone="error" className="signup__error">
              {error}
            </Alert>
          )}
          <Button type="submit" fullWidth loading={isSubmitting} loadingLabel="Signing up">
            Submit
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default SignUp;
