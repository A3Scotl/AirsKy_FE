"use client";

import { useState, useEffect } from "react";
import SEO from "@/components/common/seo";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";
import ResetForm from "@/components/auth/reset-form";
import { AnimatePresence } from "framer-motion";
import PageTransition from "@/components/common/page-transition";

export default function AuthPage() {
  const [currentView, setCurrentView] = useState("login");

  const getTitleByView = (view) => {
    switch (view) {
      case "login":
        return "Đăng nhập";
      case "register":
        return "Đăng ký";
      case "reset":
        return "Đặt lại mật khẩu";
      default:
        return "Xác thực";
    }
  };

  const getDescriptionByView = (view) => {
    switch (view) {
      case "login":
        return "Đăng nhập vào tài khoản AirSky để đặt vé máy bay và quản lý chuyến đi của bạn.";
      case "register":
        return "Tạo tài khoản AirSky miễn phí để trải nghiệm dịch vụ đặt vé máy bay tốt nhất.";
      case "reset":
        return "Đặt lại mật khẩu cho tài khoản AirSky của bạn.";
      default:
        return "Đăng nhập hoặc đăng ký tài khoản AirSky.";
    }
  };

  return (
    <>
      <SEO
        title={getTitleByView(currentView)}
        description={getDescriptionByView(currentView)}
        keywords="đăng nhập, đăng ký, tài khoản AirSky, đặt vé máy bay"
      />
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
    </>
  );
}
