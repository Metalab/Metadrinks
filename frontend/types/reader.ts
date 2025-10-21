export type ReaderDeviceModel = "solo" | "virtual-solo";

export type ReaderStatus = "unknown" | "processing" | "paired" | "expired";

export interface ReaderDevice {
  identifier: string;
  model: ReaderDeviceModel;
}

export interface Reader {
  created_at: string;
  device: ReaderDevice;
  id: string;
  meta?: Record<string, any>;
  name: string;
  status: ReaderStatus;
  updated_at: string;
}