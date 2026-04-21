"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { BarcodeSearchInput } from "@/components/search-barcode-input";

const greetings = [{ text: "Hello" }];

export default function SetupPage() {
  const [currentGreeting, setCurrentGreeting] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGreeting((prev) => (prev + 1) % greetings.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-white via-white to-blue-50 dark:from-black dark:via-black dark:to-blue-950 overflow-hidden">
      <BarcodeSearchInput visible={false} />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 dark:bg-blue-600 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 dark:bg-purple-600 animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-3xl">
        <motion.div
          key={currentGreeting}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            duration: 1,
            ease: "easeInOut",
          }}
          className="mb-8"
        >
          <h1 className="text-9xl sm:text-[120px] md:text-[160px] font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 dark:from-blue-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent tracking-tight">
            {greetings[currentGreeting].text}
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="space-y-4"
        >
          <p className="text-2xl md:text-4xl font-semibold text-gray-800 dark:text-gray-200 tracking-wide">
            Scan a barcode to continue
          </p>

          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400">
            or{" "}
            <Link
              href="/users"
              className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors"
            >
              manually select a user
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
