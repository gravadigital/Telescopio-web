import React, { useState, FormEvent, ChangeEvent, useEffect } from "react";
import "./Auth.css";
import { useAuth } from "../../context/AuthContext";
import { AuthProps, FormData, User } from "../../types";
import { UserService } from "../../services/api";
import ApiStatusAuth from "../api-status-auth/ApiStatusAuth";
import AuthForm from "../auth-form/AuthForm";
import LinkButton from "../link-button/LinkButton";

const Auth: React.FC<AuthProps> = ({ initialMode = "login" }) => {
  const [isLogin, setIsLogin] = useState<boolean>(initialMode === "login");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
  });
  const [error, setError] = useState<string>("");
  const [apiAvailable, setApiAvailable] = useState<boolean>(false);

  useEffect(() => {
    const checkApi = () => {
      const isHealthy = true;
      setApiAvailable(isHealthy);
    };
    checkApi();
  }, []);

  const handleSwitchMode = (): void => {
    setIsLogin(!isLogin);
    setError("");
    setFormData({ name: "", email: "" });
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h2>🔭 {isLogin ? "Login" : "Register"}</h2>
      </div>

      <ApiStatusAuth apiAvailable={apiAvailable} />
      <AuthForm
        mode={isLogin ? "login" : "register"}
        setMode={(mode) => setIsLogin(mode === "login")}
        error={error}
        setError={setError}
        formData={formData}
        setFormData={setFormData}
        apiAvailable={apiAvailable}
      />
      <p>{isLogin ? "Don't have an account? " : "Already have an account? "}</p>
      <LinkButton
        label={isLogin ? "Register here" : "Login"}
        onClick={handleSwitchMode}
      />

      <div className="auth-info">
        <p className="demo-notice">
          💡 This is a demo project.
          {!apiAvailable && " API is not available, running in local mode."}
        </p>
      </div>
    </div>
  );
};

export default Auth;
