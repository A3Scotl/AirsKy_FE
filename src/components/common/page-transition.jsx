"use client"

import { useEffect } from "react";
import { motion } from "framer-motion";

const PageTransition = ({ children }) => {
  // Scroll lên đầu trang khi component mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const variants = {
    initial: { opacity: 0, y: 10, scale: 1 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 1 },
  };

  return (
    <motion.div
      style={{
        backgroundColor: "white",
        minHeight: "100vh",
        width: "100%",
      }}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        duration: 0.35,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  )
}

export default PageTransition;
