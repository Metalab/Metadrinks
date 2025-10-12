"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import UserCards from "@/components/user-cards";
import { useAuth } from "@/components/auth-context";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { PlusIcon, SearchIcon } from "lucide-react";
import { UserDialog } from "@/components/user-dialog";

export default function Home() {
  const [search, setSearch] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { loggedIn, login } = useAuth();

  const handleUserCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    await login("Guest");
    setGuestLoading(false);
  };

  return (
    <div className="font-sans items-center justify-items-center p-8 pb-20 gap-16">
      <main className="flex flex-col items-center gap-8">
        <Button
          variant="outline"
          onClick={handleGuestLogin}
          disabled={guestLoading}
          className="relative"
        >
          {guestLoading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Spinner />
            </span>
          )}
          <span className={guestLoading ? "opacity-0" : ""}>
            Continue as guest
          </span>
        </Button>
        <Separator />
        <div className="flex flex-row items-center justify-center gap-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Enter your username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex justify-center">
            <Button size="icon" onClick={() => setUserDialogOpen(true)}>
              <PlusIcon />
            </Button>
          </div>
        </div>
        <div className="flex flex-row flex-wrap justify-center w-full gap-4">
          <UserCards search={search} key={refreshTrigger} />
        </div>
      </main>
      <UserDialog
        open={userDialogOpen}
        setOpen={setUserDialogOpen}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
}
