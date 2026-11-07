export interface Settings {
  maintenance: boolean;
  default_reader_id?: string;
  merchant_info?: string;
  balance_settings?: BalanceSettings;
  ui_settings?: UISettings;
}

export interface BalanceSettings {
  enabled: boolean;
  min?: number;
  max?: number;
}

export interface UISettings {
  showNumpad?: boolean;
}