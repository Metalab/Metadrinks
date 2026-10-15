export interface Settings {
  maintenance: boolean;
  default_reader_id?: string;
  merchant_info?: string;
  ui_settings?: UISettings;
}

export interface UISettings {
  showNumpad?: boolean;
}