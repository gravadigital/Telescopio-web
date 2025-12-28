import React, { ChangeEvent, FormEvent, useState } from "react";
import { FormData, User } from "../../types";
import { UserService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function AuthForm({ initialMode = "login" }) {
  const [apiAvailable, setApiAvailable] = useState<boolean>(false);
  const [isLogin, setIsLogin] = useState<boolean>(initialMode === "login");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const { login } = useAuth();

  const [error, setError] = useState<string>("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.email) {
        throw new Error("Email is required");
      }

      if (!isLogin && !formData.name) {
        throw new Error("Name is required for registration");
      }

      let userData: User;
      let token: string;

      if (apiAvailable) {
        try {
          if (isLogin) {
            // Try to authenticate with real API (using demo password for now)
            const authResponse = await UserService.authenticateUser(
              formData.email,
              "demo123"
            );
            userData = authResponse.user;
            token = authResponse.token;
            console.log("✅ User authenticated with API:", userData);
            console.log(
              "🔑 Token received:",
              token ? `${token.substring(0, 30)}...` : "NO TOKEN"
            );
            login(userData, token);
          } else {
            // Create new user
            const createResponse = await UserService.createUser({
              name: formData.name || "User",
              email: formData.email,
            });
            console.log(
              "✅ User created successfully:",
              createResponse.user.email
            );

            // Show success message and switch to login mode
            setError(""); // Clear any previous errors
            alert(
              `Registration successful!\n\nEmail: ${createResponse.user.email}\nPassword: demo123\n\nPlease login with these credentials.`
            );
            setIsLogin(true);
            setFormData({ name: "", email: formData.email }); // Keep email for convenience
          }
        } catch (apiError: any) {
          console.error("API authentication failed:", apiError);
          setError(
            apiError.message ||
              "Authentication failed. Please check your credentials."
          );
          setLoading(false);
          return;
        }
      } else {
        throw new Error("API not available");
      }
    } catch (err: any) {
      console.warn("Using demo authentication:", err);

      // Fallback: create local demo user
      const demoUserData: User = {
        id: `user_${Date.now()}`,
        name: formData.name || formData.email.split("@")[0],
        email: formData.email,
        role: "participant",
        joinedEventIDs: [],
        createdEventIDs: [],
      };

      // Use a dummy token for demo mode
      const demoToken = "demo-token-" + Date.now();
      login(demoUserData, demoToken);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {!isLogin && (
        <div className="form-group">
          <label htmlFor="name">Full name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your full name"
            required={!isLogin}
          />
        </div>
      )}

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="your@email.com"
          required
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <button type="submit" className="auth-submit-btn" disabled={loading}>
        {loading ? "Processing..." : isLogin ? "🚀 Login" : "✨ Register"}
      </button>
    </form>
  );
}
