import { motion } from "framer-motion";

const LoadingPage = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-[3px] bg-transparent z-50">
      <motion.div
        className="h-full bg-blue-600"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
    </div>
  );
};

export default LoadingPage;