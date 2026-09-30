import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert, Button, Card, TextField } from "../ui";
import "./Login.scss";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (!response || typeof response.ok !== "boolean") {
        throw new Error("Invalid authentication response");
      }
      if (!response.ok) {
        let data = {};
        try {
          data = await response.json();
        } catch {
          // Ignore malformed/empty error bodies and fall back to the default message.
        }
        throw new Error(data.error || "Login failed");
      }

      await login();
      navigate("/");
    } catch (err) {
      // A rejected fetch (offline, DNS failure, etc.) surfaces as a TypeError,
      // distinct from an API error response which already has a useful message.
      setError(err instanceof TypeError ? "Unable to reach the server. Please try again." : err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login">
      <Card as="section" className="login__card" material="thick" padding="lg">
        <h1>Welcome Back</h1>
        <form className="login__form" onSubmit={handleSubmit}>
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
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="Enter password"
            required
          />
          {error && (
            <Alert tone="error" className="login__error">
              {error}
            </Alert>
          )}
          <Button type="submit" fullWidth loading={isSubmitting} loadingLabel="Logging in">
            Login
          </Button>
        </form>
        <p className="login__footer">
          Don&apos;t have an account? <Link to="/sign-up" data-testid="signup-link-text">Sign up</Link>
        </p>
      </Card>
    </div>
  );
}

export default Login;
