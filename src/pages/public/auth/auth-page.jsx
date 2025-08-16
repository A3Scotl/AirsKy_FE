"use client";

import { useState } from "react";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";
import ResetForm from "@/components/auth/reset-form";
import { AnimatePresence } from "framer-motion";
import PageTransition from "@/components/common/page-transition";

export default function AuthPage() {
  const [currentView, setCurrentView] = useState("login"); // "login" | "register" | "reset"

  return (
    <AnimatePresence mode="wait" initial={false}>
      {currentView === "login" && (
        <PageTransition key="login">
          <LoginForm setCurrentView={setCurrentView} />
        </PageTransition>
      )}
      {currentView === "register" && (
        <PageTransition key="register">
          <RegisterForm setCurrentView={setCurrentView} />
        </PageTransition>
      )}
      {currentView === "reset" && (
        <PageTransition key="reset">
          <ResetForm setCurrentView={setCurrentView} />
        </PageTransition>
      )}
    </AnimatePresence>
  );
}
