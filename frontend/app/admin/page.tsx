"use client";
import { useAuth } from "@/components/auth-context";
import { useUser, User } from "@/components/user-context";
import { useState, useEffect } from "react";
import PasswordDialog from "@/components/password-dialog";

export default function AdminPage() {
  const { loggedIn, isInitialized, logout } = useAuth();
  const { user } = useUser();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    "Please log in with an admin account to access this page.",
  );

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (loggedIn && user) {
      if (!user.is_admin) {
        logout(false);
        setDialogOpen(true);
      } else {
        setDialogOpen(false);
      }
    } else if (!loggedIn) {
      setDialogOpen(true);
    }
  }, [isInitialized, loggedIn, user]);

  const handleValidation = async (userData: User | null) => {
    // user data is passed from login response
    if (!userData) {
      return {
        isValid: false,
        error: "User data not loaded",
      };
    }

    if (!userData.is_admin) {
      logout(false);
      setErrorMessage(
        "Access denied. You must be an admin to access this page.",
      );
      setDialogOpen(true);
      return {
        isValid: false,
        error: "Access denied. You must be an admin to access this page.",
      };
    }

    setDialogOpen(false);
    return { isValid: true };
  };

  return (
    <div className="h-full overflow-auto">
      <PasswordDialog
        open={dialogOpen}
        setOpen={setDialogOpen}
        username=""
        description={errorMessage}
        disableClose={true}
        redirect={false}
        onValidate={handleValidation}
      />
      {loggedIn && user?.is_admin && (
        <main className="flex flex-col items-center gap-8">
          <h1 className="text-2xl font-bold">Admin Page</h1>
        </main>
      )}
    </div>
  );
}
