"use client";

import { useAuth } from "@/components/auth-context";
import { User, useUser } from "@/components/user-context";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { config } from "@/lib/config";
import { Button } from "@/components/ui/button";
import UserAdminDialog from "@/components/user-admin-dialog";
import { useContentUpdates } from "@/hooks/use-sse-events";
import { PlusIcon } from "lucide-react";
import { columns } from "./columns";
import { DataTable } from "./data-table";

export default function AdminUsersPage() {
  const { loggedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (!loggedIn) {
      router.push("/admin");
      return;
    }

    if (user && !user.is_admin) {
      router.push("/admin");
    }
  }, [loggedIn, user, router]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useContentUpdates((data) => {
    if (data.content_payload.type === "users") {
      fetchUsers();
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${config.apiBaseUrl}/admin/v1/users`, {
        credentials: "include",
      });
      const data = await res.json();
      const usersData: User[] = Array.isArray(data) ? data : data.data || [];
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    fetchUsers();
  };

  if (!loggedIn) {
    return null;
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user.is_admin) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manage Users</h1>
          <Button onClick={handleCreateNew}>
            <PlusIcon />
            Create New User
          </Button>
        </div>

        <DataTable columns={columns(handleEditUser, user?.id)} data={users} />
      </div>

      <UserAdminDialog
        open={dialogOpen}
        setOpen={setDialogOpen}
        user={selectedUser}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
