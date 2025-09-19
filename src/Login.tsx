// src/Login.tsx
import React, { useState, useEffect } from "react";
import "./Login.profile.css";
import emailjs, { EmailJSResponseStatus } from "@emailjs/browser";

// Access environment variables for EmailJS
const emailJsServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const emailJsPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const loginTemplateId = import.meta.env.VITE_EMAILJS_LOGIN_TEMPLATE_ID;
const registrationTemplateId = import.meta.env
  .VITE_EMAILJS_REGISTRATION_TEMPLATE_ID;
const passwordResetTemplateId = import.meta.env
  .VITE_EMAILJS_PASSWORD_RESET_TEMPLATE_ID;
const companyAdminEmail = import.meta.env.VITE_COMPANY_ADMIN_EMAIL;

const Login: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  // State variables remain the same
  // State variables remain the same
  // Registration page toggle
  const [showRegisterPage, setShowRegisterPage] = useState(false);
  const [registerUserType, setRegisterUserType] = useState<"user" | "admin">(
    "user"
  );
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirm, setRegisterConfirm] = useState("");
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerInfo, setRegisterInfo] = useState<string | null>(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [userType, setUserType] = useState<"user" | "admin">("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalAnimation, setModalAnimation] = useState(false);
  // Forgot password modal state
  const [resetEmail, setResetEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  // Email validation
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Keyboard support for modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowForgotPassword(false);
      }
    };

    if (showForgotPassword) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showForgotPassword]);

  // Modal animations
  useEffect(() => {
    if (showForgotPassword) {
      setModalAnimation(true);
    }
  }, [showForgotPassword]);

  // Handle forgot password
  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!validateEmail(resetEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      // This is a mock reset link. In a real app, you'd generate a unique token.
      const resetLink = `${
        window.location.origin
      }/reset-password?email=${encodeURIComponent(resetEmail)}`;

      await emailjs.send(
        emailJsServiceId,
        passwordResetTemplateId,
        {
          to_email: resetEmail,
          to_name: resetEmail,
          reset_link: resetLink,
          message: "Here is your password reset link.",
        },
        emailJsPublicKey
      );
      setInfo(`A password reset link has been sent to ${resetEmail}.`);
      setShowForgotPassword(false);
    } catch (err) {
      setError("Failed to send password reset email. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle registration
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegisterError(null);
    setRegisterInfo(null);
    setRegisterLoading(true);
    try {
      if (
        !registerUsername ||
        !registerEmail ||
        !registerPassword ||
        !registerConfirm
      ) {
        throw new Error("All fields are required.");
      }
      if (registerPassword !== registerConfirm) {
        throw new Error("Passwords do not match");
      }
      const registrationData = {
        name: registerUsername,
        email: registerEmail,
        password: registerPassword,
        role: registerUserType,
      };
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {}
      if (!res.ok) {
        throw new Error(
          data?.error || `Registration failed (HTTP ${res.status})`
        );
      }
      // Send registration confirmation email
      try {
        await emailjs.send(
          emailJsServiceId,
          registrationTemplateId,
          {
            to_email: registerEmail,
            to_name: registerUsername,
            message: "Thank you for registering with AyaSync!",
          },
          emailJsPublicKey
        );
      } catch (emailErr) {
        // Non-critical, so we just warn in the console
        console.warn("Failed to send registration email.");
      }

      // Send notification to company admin email
      try {
        await emailjs.send(
          emailJsServiceId,
          "YOUR_ADMIN_REG_TEMPLATE_ID", // Replace with your Admin Notification Template ID
          {
            admin_email: companyAdminEmail, // Standardized for clarity in template
            user_name: registerUsername,
            user_email: registerEmail,
          },
          emailJsPublicKey
        );
      } catch (adminEmailErr) {
        console.warn("Failed to send admin notification for new registration.");
      }
      setEmail(registerEmail);
      setPassword(registerPassword);
      setRegisterInfo("Account created. Logging you in...");
      // Automatically log in after registration
      setTimeout(async () => {
        try {
          await submitLogin(registerEmail, registerPassword);
        } catch (err: any) {
          setError(
            err?.message || "Auto-login failed. Please log in manually."
          );
        }
      }, 500);
    } catch (err: any) {
      setRegisterError(err?.message || "Request failed");
    } finally {
      setRegisterLoading(false);
    }
  }

  // Handle login
  async function submitLogin(loginEmail?: string, loginPassword?: string) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail || email,
          password: loginPassword || password,
          userType,
        }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      console.log("Login request:", { email: loginEmail || email, userType });
      console.log("Login response:", { ...data, token: "[HIDDEN]" });

      if (!res.ok) {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        throw new Error(data?.error || `Login failed (HTTP ${res.status})`);
      }

      localStorage.setItem("authToken", data.token);
      setFailedAttempts(0);
      onSuccess();
    } catch (err: any) {
      // Re-throw the error to be caught by the calling function (onSubmit)
      setError(err?.message || "Request failed");
      throw err;
    }
  }

  // Form submission handler
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await submitLogin(); // This will use the state email/password

      // After a successful login, fetch the user's profile to get their confirmed email and name.
      const profileRes = await fetch("/api/users/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const userProfile = await profileRes.json();
      const loggedInUserEmail = userProfile.email;

      if (!loggedInUserEmail) {
        // Silently fail or handle the case where email is not available.
        console.warn(
          "Could not retrieve user email after login for notification."
        );
        return;
      }

      // Send login notification email via EmailJS
      await emailjs.send(
        emailJsServiceId,
        loginTemplateId,
        {
          to_email: loggedInUserEmail,
          name: userProfile.name || loggedInUserEmail, // Use the fetched name
          message: "Login attempt on AyaSync PMS",
        },
        emailJsPublicKey
      );
      setInfo("Login notification sent!");

      // Send login notification to company admin email
      try {
        await emailjs.send(
          emailJsServiceId,
          "YOUR_ADMIN_LOGIN_TEMPLATE_ID", // Replace with your Admin Login Notification Template ID
          {
            admin_email: companyAdminEmail, // Standardized for clarity
            user_email: loggedInUserEmail,
            user_name: userProfile.name || loggedInUserEmail, // Add the user's name
          },
          emailJsPublicKey
        );
      } catch (adminEmailErr) {
        console.warn("Failed to send admin notification for login.");
      }
    } catch (err: any) {
      // Check if the error is from EmailJS or another source
      // The login error from submitLogin() will be caught here first.
      if (err instanceof EmailJSResponseStatus) {
        console.error("EmailJS Error:", err);
        setError("Failed to send email notification. Please try again.");
      } else if (!error) {
        // If setError was already called in submitLogin, don't overwrite it.
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Reset form when modal closes
  useEffect(() => {
    if (!showForgotPassword) {
      setEmail("");
      setPassword("");
      setError(null);
      setInfo(null);
    }
  }, [showForgotPassword]);

  return (
    <div className="login-container">
      {/* Left Panel - Login or Register Form */}
      <div className="login-left-panel">
        <div className="login-form-wrapper">
          {!showRegisterPage ? (
            <form onSubmit={onSubmit}>
              <h1 className="login-title">Log In</h1>
              <p className="login-subtitle">Log in to access your account</p>
              {/* ...existing code for login form... */}
              <div className="user-type-selector">
                <button
                  type="button"
                  onClick={() => setUserType("user")}
                  className={`user-type-button ${
                    userType === "user" ? "user" : "inactive"
                  }`}
                >
                  <span>👤</span>User
                </button>
                <button
                  type="button"
                  onClick={() => setUserType("admin")}
                  className={`user-type-button ${
                    userType === "admin" ? "admin" : "inactive"
                  }`}
                >
                  <span>👑</span>Admin
                </button>
              </div>
              <label className="form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Enter your email"
                required
              />
              <label className="form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Enter your password"
                required
              />
              {failedAttempts >= 3 && (
                <div className="warning-message">
                  <span>⚠️</span>Too many failed attempts. Please use the forgot
                  password option.
                </div>
              )}
              <div style={{ marginBottom: "16px", textAlign: "right" }}>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="forgot-password-link"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="remember-me-container">
                <input
                  type="checkbox"
                  id="remember"
                  style={{ marginRight: 8 }}
                />
                <label htmlFor="remember" className="remember-me-label">
                  Remember Me
                </label>
              </div>
              {error && <div className="error-message">{error}</div>}
              {info && <div className="info-message">{info}</div>}
              <button disabled={loading} type="submit" className="button">
                <span>👤</span>
                {loading ? "Logging in..." : "Log In"}
              </button>
              <div className="divider">
                <div className="divider-line"></div>
                <span className="divider-text">OR</span>
                <div className="divider-line"></div>
              </div>
              <button type="button" className="button social">
                <span className="social-icon facebook">f</span>Sign in with
                Facebook
              </button>
              <button type="button" className="button social">
                <span className="social-icon google">G</span>Sign in with Google
              </button>
              <div className="register-button-container">
                <button
                  type="button"
                  onClick={() => setShowRegisterPage(true)}
                  className="register-button"
                >
                  <span>👤</span>Register New Account
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <h1 className="login-title">Register</h1>
              <p className="login-subtitle">
                Create a new account to access your personalized dashboard
              </p>
              <div className="user-type-selector">
                <button
                  type="button"
                  onClick={() => setRegisterUserType("user")}
                  className={`user-type-button ${
                    registerUserType === "user" ? "user" : "inactive"
                  }`}
                >
                  <span>👤</span>User
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterUserType("admin")}
                  className={`user-type-button ${
                    registerUserType === "admin" ? "admin" : "inactive"
                  }`}
                >
                  <span>👑</span>Admin
                </button>
              </div>
              <label className="form-label">Username</label>
              <input
                type="text"
                value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value)}
                className="form-input"
                placeholder="Enter your username"
                required
              />
              <label className="form-label">Email</label>
              <input
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                className="form-input"
                placeholder="Enter your email"
                required
              />
              <label className="form-label">Password</label>
              <input
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                className="form-input"
                placeholder="Enter your password"
                required
              />
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                value={registerConfirm}
                onChange={(e) => setRegisterConfirm(e.target.value)}
                className="form-input"
                placeholder="Confirm your password"
                required
              />
              {registerError && (
                <div className="error-message">{registerError}</div>
              )}
              {registerInfo && (
                <div className="info-message">{registerInfo}</div>
              )}
              <button
                type="submit"
                disabled={registerLoading}
                className="button"
              >
                {registerLoading ? "Creating Account..." : "Register"}
              </button>
              <div className="register-button-container">
                <button
                  type="button"
                  onClick={() => setShowRegisterPage(false)}
                  className="button secondary"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right Panel - Info Section */}
      <div className="login-right-panel">
        <div className="info-content">
          <h1 className="brand-title">AyaSync</h1>
          <div className="brand-accent"></div>
          <p className="brand-description">
            Welcome back! Log in to access your personalized dashboard where
            real-time data and tasks are just a click away.
          </p>

          {/* User Type Info Card */}
          <div
            className={`user-info-card ${userType === "admin" ? "admin" : ""}`}
          >
            <div className="user-info-icon">
              {userType === "admin" ? "👑" : "👤"}
            </div>
            <h3 className="user-info-title">
              {userType === "admin" ? "Admin Access" : "User Access"}
            </h3>
            <p className="user-info-description">
              {userType === "admin"
                ? "Full system control, user management, analytics, and administrative tools. Any email can be used for admin registration."
                : "Personal dashboard, task management, and collaboration features."}
            </p>
          </div>
          <h3 className="trusted-companies-title">Our Trusted Companies:</h3>
          <div className="trusted-companies-container">
            <div className="company-info">
              <div className="company-logo">S</div>
              <div>
                <div className="company-name">MAKERSPACE</div>
                <div className="company-subtitle">INNOVHUB</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-overlay">
          <div className={`modal-content ${modalAnimation ? "show" : ""}`}>
            <div className="modal-header">
              <h2 className="modal-title">Reset Password</h2>
              <p className="modal-description">
                Enter your email and we'll send you a link to reset your
                password.
              </p>
            </div>
            <div className="modal-body">
              <form onSubmit={handleForgotPassword}>
                <div className="modal-form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => {
                      setResetEmail(e.target.value);
                      setEmailError("");
                    }}
                    className="form-input"
                    placeholder="Enter your email"
                    required
                  />
                  {emailError && (
                    <div className="error-message">{emailError}</div>
                  )}
                </div>
                {(error || info) && (
                  <div className={`message-box ${error ? "error" : "success"}`}>
                    {error || info}
                  </div>
                )}
                <div className="modal-footer">
                  <div className="modal-button-group">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="button"
                    >
                      {isSubmitting ? "Sending..." : "Send Reset Link"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setError(null);
                        setInfo(null);
                        setEmailError("");
                      }}
                      className="button secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
