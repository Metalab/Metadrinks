"use client";

import { useUser } from "@/components/user-context";
import { useAuth } from "@/components/auth-context";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { config } from "@/lib/config";
import { useContentUpdates } from "@/hooks/use-sse-events";
import { useAdminProtection } from "@/hooks/use-admin-protection";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { Purchase } from "@/types/purchase";

export default function AdminPurchasesPage() {
  useAdminProtection();
  const { loggedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState<number>(25);
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    const limitParam = searchParams.get("limit");
    const pageParam = searchParams.get("page");
    if (limitParam) {
      setLimit(parseInt(limitParam, 10));
    }
    if (pageParam) {
      setPage(parseInt(pageParam, 10));
    }
  }, [searchParams]);

  useEffect(() => {
    fetchPurchases();
  }, [limit, page]);

  useContentUpdates((data) => {
    if (data.content_payload.type === "purchases") {
      fetchPurchases();
    }
  }, []);

  const fetchPurchases = async () => {
    try {
      const url = new URL(`${config.apiBaseUrl}/api/v1/purchases`);
      url.searchParams.append("limit", limit.toString());
      url.searchParams.append("page", page.toString());
      const res = await fetch(url.toString(), {
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

  const handleLimitChange = (newLimit: string) => {
    const limitValue = parseInt(newLimit, 10);
    setLimit(limitValue);
    setPage(1);
    router.push(`?limit=${limitValue}&page=1`);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    router.push(`?limit=${limit}&page=${newPage}`);
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

        <DataTable
          columns={columns}
          data={purchases}
          pageSize={limit}
          onLimitChange={handleLimitChange}
          currentLimit={limit}
          currentPage={page}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
