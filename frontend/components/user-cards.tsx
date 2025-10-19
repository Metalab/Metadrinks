"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "./ui/card";
import PasswordDialog from "./password-dialog";
import { config } from "@/lib/config";
import { useLogin } from "@/hooks/use-login";
import { Spinner } from "./ui/spinner";

type User = {
  id: string; //uuid
  name: string;
  image: string;
  balance: number;
  is_active: boolean;
};

export default function UserCards({ search = "" }: { search?: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const { loading, dialogOpen, setDialogOpen, dialogUsername, handleLogin } =
    useLogin();

  useEffect(() => {
    fetch(`${config.apiBaseUrl}/api/v1/users`)
      .then((res) => res.json())
      .then((data) => {
        let users: User[] = Array.isArray(data) ? data : data.data || [];
        users = users.filter((user) => user.name !== "Guest");
        setUsers(users);
      });
  }, []);

  const onUserClick = (user: User) => {
    handleLogin(user.name, user.id);
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="mt-4">
      <PasswordDialog
        open={dialogOpen}
        setOpen={setDialogOpen}
        username={dialogUsername}
        description="This user has enabled password protection. Please enter the password to continue."
        passwordInputMode="numeric"
      />
      {filteredUsers.length === 0 ? (
        <div className="text-gray-500">No results found.</div>
      ) : (
        <div className="flex flex-wrap gap-x-4 gap-y-4 justify-center">
          {filteredUsers.map((user) => {
            const isLoading = loading[user.id];
            return (
              <Button
                key={user.id}
                variant="ghost"
                className="p-0 w-48 justify-between relative mb-14"
                onClick={() => onUserClick(user)}
                disabled={!user.is_active || isLoading}
                aria-disabled={!user.is_active || isLoading}
                style={{
                  cursor:
                    !user.is_active || isLoading ? "not-allowed" : "pointer",
                }}
              >
                <Card
                  className={`w-48 justify-between relative py-4 ${
                    !user.is_active || isLoading
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }`}
                >
                  <CardHeader className="px-2">
                    <CardTitle className="break-words whitespace-normal hyphens-auto leading-normal wrap-anywhere">
                      {user.name}
                    </CardTitle>
                    <CardDescription>
                      {(user.balance / 100).toFixed(2)}€
                    </CardDescription>
                  </CardHeader>
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Spinner />
                    </div>
                  )}
                </Card>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
