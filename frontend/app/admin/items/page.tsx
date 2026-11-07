"use client";

import { useUser } from "@/components/user-context";
import { useAuth } from "@/components/auth-context";
import { useEffect, useState } from "react";
import { config } from "@/lib/config";
import { Button } from "@/components/ui/button";
import ItemDialog from "@/components/item-admin-dialog";
import ItemCards from "@/components/item-cards";
import { useContentUpdates } from "@/hooks/use-sse-events";
import { useAdminProtection } from "@/hooks/use-admin-protection";
import { PlusIcon } from "lucide-react";
import { Item } from "@/types/item";

export default function AdminItemsPage() {
  useAdminProtection();
  const { loggedIn } = useAuth();
  const { user } = useUser();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  useContentUpdates((data) => {
    if (data.content_payload.type === "items") {
      fetchItems();
    }
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/v1/items`);
      const data = await res.json();
      const itemsData: Item[] = Array.isArray(data) ? data : data.data || [];
      setItems(itemsData);
    } catch (error) {
      console.error("Failed to fetch items:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedItem(null);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    fetchItems();
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
        <p>Loading items...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manage Items</h1>
          <Button onClick={handleCreateNew}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create New Item
          </Button>
        </div>

        <ItemCards items={items} onItemClick={handleItemClick} />
      </div>

      <ItemDialog
        open={dialogOpen}
        setOpen={setDialogOpen}
        item={selectedItem}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
