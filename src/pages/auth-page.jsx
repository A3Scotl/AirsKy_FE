"use client";

import { useState } from "react";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";
import ResetForm from "@/components/auth/reset-form";

export default function AuthPage() {
  const [currentView, setCurrentView] = useState("login"); // "login" | "register" | "reset"

  return (
    <>
      {currentView === "login" && <LoginForm setCurrentView={setCurrentView} />}
      {currentView === "register" && <RegisterForm setCurrentView={setCurrentView} />}
      {currentView === "reset" && <ResetForm setCurrentView={setCurrentView} />}
    </>
  );
}
