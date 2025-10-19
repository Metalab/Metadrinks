"use client";

import { useAuth } from "@/components/auth-context";
import { useUser } from "@/components/user-context";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { config } from "@/lib/config";
import { useContentUpdates } from "@/hooks/use-sse-events";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { Purchase } from "@/types/purchase";

export default function AdminPurchasesPage() {
  const { loggedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

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
    fetchPurchases();
  }, []);

  useContentUpdates((data) => {
    if (data.content_payload.type === "purchases") {
      fetchPurchases();
    }
  }, []);

  const fetchPurchases = async () => {
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/v1/purchases`, {
        credentials: "include",
      });
      const data = await res.json();
      const purchasesData: Purchase[] = Array.isArray(data)
        ? data
        : data.data || [];
      setPurchases(purchasesData);
    } catch (error) {
      console.error("Failed to fetch purchases:", error);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
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
        <p>Loading purchases...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Purchases</h1>
        </div>

        <DataTable columns={columns} data={purchases} />
      </div>
    </div>
  );
}
