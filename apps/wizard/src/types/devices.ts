export interface PendingDevice {
  requestId: string;
  deviceId: string;
  displayName?: string;
  platform?: string;
  clientId?: string;
  clientMode?: string;
  role?: string;
  roles?: string[];
  scopes?: string[];
  remoteIp?: string;
  ts: number;
}

export interface PairedDevice {
  deviceId: string;
  displayName?: string;
  platform?: string;
  clientId?: string;
  clientMode?: string;
  role?: string;
  roles?: string[];
  scopes?: string[];
  createdAtMs: number;
  approvedAtMs: number;
}

export interface DevicesResponse {
  ok: boolean;
  pending: PendingDevice[];
  paired: PairedDevice[];
  error?: string;
}

export interface ApproveResponse {
  ok: boolean;
  success?: boolean;
  requestId?: string;
  message?: string;
  error?: string;
}

export interface ApproveAllResponse {
  ok: boolean;
  approved?: string[];
  failed?: Array<{ requestId: string; error: string }>;
  message?: string;
  error?: string;
}
