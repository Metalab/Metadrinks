import { useAuth } from "@/components/auth-context";
import { useUser } from "@/components/user-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const useAdminProtection = () => {
  const { loggedIn, isInitialized } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (!loggedIn) {
      router.push("/admin");
      return;
    }

    if (user && !user.is_admin) {
      router.push("/admin");
    }
  }, [isInitialized, loggedIn, user, router]);
};
