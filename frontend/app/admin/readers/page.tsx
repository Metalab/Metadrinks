"use client";

import { useAuth } from "@/components/auth-context";
import { useUser } from "@/components/user-context";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { config } from "@/lib/config";
import { useContentUpdates } from "@/hooks/use-sse-events";
import { createColumns } from "./columns";
import { DataTable } from "./data-table";
import { Reader } from "@/types/reader";
import { Button } from "@/components/ui/button";
import { Link2Icon } from "lucide-react";
import LinkReaderDialog from "@/components/link-reader-dialog";
import { toast } from "sonner";
import { useSettings } from "@/components/settings-context";
import { Spinner } from "@/components/ui/spinner";
import { DeleteReaderDialog } from "@/components/delete-reader-dialog";

export default function AdminReadersPage() {
  const { loggedIn } = useAuth();
  const { user } = useUser();
  const { settings, refreshSettings } = useSettings();
  const router = useRouter();
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [readerToDelete, setReaderToDelete] = useState<Reader | null>(null);
  const hasFetchedRef = useRef(false);

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
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchReaders();
    }
  }, []);

  useContentUpdates((data) => {
    if (data.content_payload.type === "readers") {
      fetchReaders();
    }
  }, []);

  const fetchReaders = async () => {
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/payment/v1/readers`, {
        credentials: "include",
      });
      const data = await res.json();
      const readersData: Reader[] = Array.isArray(data)
        ? data
        : data.data || [];
      setReaders(readersData);
    } catch (error) {
      console.error("Failed to fetch readers:", error);
      setReaders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const isDefault = settings?.default_reader_id === id;

      const res = await fetch(
        `${config.apiBaseUrl}/api/payment/v1/readers/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete reader");
      }

      if (isDefault) {
        await handleSetDefault("");
      }

      toast.success("Reader deleted successfully");
      setDeleteDialogOpen(false);
      setReaderToDelete(null);
      await fetchReaders();
    } catch (error) {
      console.error("Failed to delete reader:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete reader"
      );
    }
  };

  const handleSetDefault = async (readerId: string) => {
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/admin/v1/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          default_reader_id: readerId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update default reader");
      }

      await refreshSettings();

      if (readerId) {
        toast.success("Default reader updated successfully");
      }
    } catch (error) {
      console.error("Failed to set default reader:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update default reader"
      );
    }
  };

  const handleDeleteClick = (reader: Reader) => {
    setReaderToDelete(reader);
    setDeleteDialogOpen(true);
  };

  const columns = createColumns(
    handleDeleteClick,
    handleSetDefault,
    settings?.default_reader_id
  );

  if (!loggedIn) {
    return null;
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  if (!user.is_admin) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="flex flex-col items-center gap-2">
          <Spinner />
          <p className="text-sm text-muted-foreground">Loading readers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Card Readers</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage linked card readers for payment processing.
              <br />
              SumUp Merchant: {settings?.merchant_info || "none"}
            </p>
          </div>
          <Button onClick={() => setLinkDialogOpen(true)}>
            <Link2Icon className="mr-2 h-4 w-4" />
            Link Reader
          </Button>
        </div>

        <DataTable columns={columns} data={readers} />
      </div>

      <LinkReaderDialog
        open={linkDialogOpen}
        setOpen={setLinkDialogOpen}
        onSuccess={fetchReaders}
      />

      {readerToDelete && (
        <DeleteReaderDialog
          reader={readerToDelete}
          isDefault={settings?.default_reader_id === readerToDelete.id}
          open={deleteDialogOpen}
          setOpen={setDeleteDialogOpen}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
