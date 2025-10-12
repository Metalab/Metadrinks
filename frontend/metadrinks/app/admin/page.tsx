"use client";
import { useAuth } from "@/components/auth-context";
import { useState } from "react";
import PasswordDialog from "@/components/password-dialog";

export default function AdminPage() {
  const { loggedIn } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Show dialog if not logged in
  if (!loggedIn && !dialogOpen) {
    setDialogOpen(true);
  }

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16">
      <PasswordDialog
        open={dialogOpen}
        setOpen={setDialogOpen}
        username=""
        description="Please log in to access the admin page."
        disableClose={true}
      />
      {loggedIn && (
        <main className="flex flex-col items-center gap-8">
          <h1 className="text-2xl font-bold">Admin Page</h1>
        </main>
      )}
    </div>
  );
}
