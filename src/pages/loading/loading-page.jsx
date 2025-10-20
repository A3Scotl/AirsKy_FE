import { motion } from "framer-motion";
import { Plane } from "lucide-react";

const LoadingPage = () => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex flex-col items-center justify-center z-[9999]">
      <div className="flex flex-col items-center text-center">
        {/* Hiệu ứng máy bay cất cánh */}
        <motion.div
          animate={{
            y: [0, -20, 0],
          }}
          transition={{
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        >
          <Plane className="w-24 h-24 text-blue-600 transform -rotate-45" />
        </motion.div>

        {/* Thanh tiến trình */}
        <div className="w-56 h-2 bg-gray-200 rounded-full overflow-hidden mt-4">
          <motion.div
            className="h-full bg-blue-600"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 1.5,
              ease: "linear",
              repeat: Infinity,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;
