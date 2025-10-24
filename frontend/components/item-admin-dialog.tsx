"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PackageIcon,
  ImageIcon,
  DollarSignIcon,
  BarcodeIcon,
  PlusIcon,
  XIcon,
  BeakerIcon,
  ShieldIcon,
  TrashIcon,
} from "lucide-react";
import { config } from "@/lib/config";
import { Item } from "@/types/item";
import { isValid } from "gtin";

export default function ItemDialog({
  open,
  setOpen,
  item,
  onSuccess,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  item?: Item | null;
  onSuccess?: () => void;
}) {
  const [name, setName] = React.useState("");
  const [variant, setVariant] = React.useState("");
  const [image, setImage] = React.useState("");
  const [volume, setVolume] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [barcodes, setBarcodes] = React.useState<string[]>([""]);
  const [barcodeErrors, setBarcodeErrors] = React.useState<(string | null)[]>([
    null,
  ]);
  const [nutritionInfo, setNutritionInfo] = React.useState<
    Array<{ name: string; value: string }>
  >([{ name: "", value: "" }]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const isEditMode = !!item?.id;

  const validateBarcodeChecksum = (barcode: string): string | null => {
    const cleanBarcode = barcode.trim();

    if (cleanBarcode === "") {
      return null; // Empty is valid (optional field)
    }

    if (!/^\d+$/.test(cleanBarcode)) {
      return "Barcode must contain only digits";
    }

    if (cleanBarcode.length !== 8 && cleanBarcode.length !== 13) {
      return "Barcode must be 8 or 13 digits (EAN-8 or EAN-13)";
    }

    if (!isValid(cleanBarcode)) {
      return `Invalid checksum`;
    }

    return null; // Valid
  };

  React.useEffect(() => {
    if (item) {
      setName(item.name || "");
      setVariant(item.variant || "");
      setImage(item.image || "");
      setVolume(item.volume?.toString() || "");
      setPrice(item.price?.toString() || "");
      setIsActive(item.is_active ?? true);
      setBarcodes(
        item.barcodes && item.barcodes.length > 0 ? item.barcodes : [""]
      );
      setBarcodeErrors(
        item.barcodes && item.barcodes.length > 0
          ? item.barcodes.map(() => null)
          : [null]
      );
      setNutritionInfo(
        item.nutrition_info && item.nutrition_info.length > 0
          ? item.nutrition_info
          : [{ name: "", value: "" }]
      );
    } else {
      setName("");
      setVariant("");
      setImage("");
      setVolume("");
      setPrice("");
      setIsActive(true);
      setBarcodes([""]);
      setBarcodeErrors([null]);
      setNutritionInfo([{ name: "", value: "" }]);
    }
    setError("");
  }, [item, open]);

  const handleAddBarcode = () => {
    setBarcodes([...barcodes, ""]);
    setBarcodeErrors([...barcodeErrors, null]);
  };

  const handleRemoveBarcode = (index: number) => {
    if (barcodes.length > 1) {
      setBarcodes(barcodes.filter((_, i) => i !== index));
      setBarcodeErrors(barcodeErrors.filter((_, i) => i !== index));
    }
  };

  const handleBarcodeChange = (index: number, value: string) => {
    const newBarcodes = [...barcodes];
    newBarcodes[index] = value;
    setBarcodes(newBarcodes);

    const newErrors = [...barcodeErrors];
    newErrors[index] = validateBarcodeChecksum(value);
    setBarcodeErrors(newErrors);
  };

  const handleAddNutrition = () => {
    setNutritionInfo([...nutritionInfo, { name: "", value: "" }]);
  };

  const handleRemoveNutrition = (index: number) => {
    if (nutritionInfo.length > 1) {
      setNutritionInfo(nutritionInfo.filter((_, i) => i !== index));
    }
  };

  const handleNutritionChange = (
    index: number,
    field: "name" | "value",
    value: string
  ) => {
    const newNutritionInfo = [...nutritionInfo];
    newNutritionInfo[index][field] = value;
    setNutritionInfo(newNutritionInfo);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const filteredBarcodes = barcodes
        .map((b) => b.trim())
        .filter((b) => b.length > 0);

      const invalidBarcodes = filteredBarcodes.filter(
        (barcode) => validateBarcodeChecksum(barcode) !== null
      );

      if (invalidBarcodes.length > 0) {
        throw new Error(
          "Please fix invalid barcodes before submitting. Check the error messages below each barcode field."
        );
      }

      // Filter out empty nutrition info entries
      const filteredNutritionInfo = nutritionInfo
        .filter((info) => info.name.trim() && info.value.trim())
        .map((info) => ({
          name: info.name.trim(),
          value: info.value.trim(),
        }));

      const itemData = {
        name,
        variant: variant || undefined,
        image: image || undefined,
        volume: parseInt(volume, 10),
        price: parseInt(price, 10),
        is_active: isActive,
        barcodes: filteredBarcodes.length > 0 ? filteredBarcodes : undefined,
        nutrition_info:
          filteredNutritionInfo.length > 0 ? filteredNutritionInfo : undefined,
      };

      const url = isEditMode
        ? `${config.apiBaseUrl}/api/v1/items/${item.id}`
        : `${config.apiBaseUrl}/api/v1/items`;

      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(itemData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          data.error || `Failed to ${isEditMode ? "update" : "create"} item`
        );
      }

      onSuccess?.();
      setOpen(false);

      setName("");
      setVariant("");
      setImage("");
      setVolume("");
      setPrice("");
      setIsActive(true);
      setBarcodes([""]);
      setBarcodeErrors([null]);
      setNutritionInfo([{ name: "", value: "" }]);
    } catch (err) {
      console.error("Item operation error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item?.id) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${config.apiBaseUrl}/api/v1/items/${item.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete item");
      }

      onSuccess?.();
      setOpen(false);
      setShowDeleteDialog(false);
    } catch (err) {
      console.error("Item delete error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Item" : "Create New Item"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update the item details below."
                : "Fill in the details to create a new item."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full items-center gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(checked === true)}
                  disabled={loading}
                />
                <div className="flex items-center gap-2">
                  <ShieldIcon className="h-4 w-4 text-muted-foreground" />
                  <Label
                    htmlFor="is_active"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Active (visible to users)
                  </Label>
                </div>
              </div>
            </div>

            <div className="grid w-full items-center gap-3">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <PackageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Item name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="grid w-full items-center gap-3">
              <Label htmlFor="variant">Variant</Label>
              <div className="relative">
                <PackageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="variant"
                  type="text"
                  placeholder="e.g., Original, Sugar Free, etc."
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid w-full items-center gap-3">
              <Label htmlFor="volume">
                Volume (ml) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <BeakerIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="volume"
                  type="number"
                  placeholder="Volume in ml (e.g., 330)"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="grid w-full items-center gap-3">
              <Label htmlFor="price">
                Price (cents) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <DollarSignIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="price"
                  type="number"
                  placeholder="Price in cents (e.g., 150 for $1.50)"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="grid w-full items-center gap-3">
              <Label htmlFor="image">Image URL</Label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="image"
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid w-full items-center gap-3">
              <div className="flex items-center justify-between">
                <Label>Barcodes</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddBarcode}
                  disabled={loading}
                  className="h-8"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Barcode
                </Button>
              </div>
              {barcodes.map((barcode, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <BarcodeIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder={`8-13 digit EAN Barcode`}
                        value={barcode}
                        minLength={8}
                        maxLength={13}
                        onChange={(e) =>
                          handleBarcodeChange(index, e.target.value)
                        }
                        disabled={loading}
                        className={`pl-10 ${
                          barcodeErrors[index] ? "border-red-500" : ""
                        }`}
                      />
                    </div>
                    {barcodes.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveBarcode(index)}
                        disabled={loading}
                        className="flex-shrink-0"
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {barcodeErrors[index] && (
                    <p className="text-xs text-red-500 ml-1">
                      {barcodeErrors[index]}
                    </p>
                  )}
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Add one or more barcodes for this item
              </p>
            </div>

            <div className="grid w-full items-center gap-3">
              <div className="flex items-center justify-between">
                <Label>Nutrition Information</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddNutrition}
                  disabled={loading}
                  className="h-8"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Info
                </Button>
              </div>
              {nutritionInfo.map((info, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Name (e.g., Calories)"
                    value={info.name}
                    onChange={(e) =>
                      handleNutritionChange(index, "name", e.target.value)
                    }
                    disabled={loading}
                    className="flex-1"
                  />
                  <Input
                    type="text"
                    placeholder="Value (e.g., 42 kcal)"
                    value={info.value}
                    onChange={(e) =>
                      handleNutritionChange(index, "value", e.target.value)
                    }
                    disabled={loading}
                    className="flex-1"
                  />
                  {nutritionInfo.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveNutrition(index)}
                      disabled={loading}
                      className="flex-shrink-0"
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Add nutrition information for this item
              </p>
            </div>
          </div>
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <DialogFooter className="sm:justify-between">
            {isEditMode && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={loading}
                className="sm:mr-auto"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <div className="flex gap-2 sm:ml-auto">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading
                  ? "Saving..."
                  : isEditMode
                  ? "Update Item"
                  : "Create Item"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
