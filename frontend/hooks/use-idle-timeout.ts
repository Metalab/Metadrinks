import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";

const IDLE_TIMEOUT = 30000; // 30 seconds

export const useIdleTimeout = () => {
  const router = useRouter();
  const { loggedIn } = useAuth();
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (loggedIn) {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      return;
    }

    const resetTimer = () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }

      timeoutIdRef.current = setTimeout(() => {
        if (!loggedIn) {
          router.push("/");
        }
      }, IDLE_TIMEOUT);
    };

    const events = ["mousemove", "keydown", "touchstart", "click", "scroll"];

    events.forEach((event) => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer, true);
      });
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, [loggedIn, router]);
};
