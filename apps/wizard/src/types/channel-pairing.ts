export type ChannelType = 'telegram' | 'discord' | 'slack';

export interface ChannelPairingRequest {
  base_url: string;
  gateway_token: string;
  channel: ChannelType;
  code: string;
}

export interface ChannelPairingResponse {
  ok: boolean;
  success?: boolean;
  channel?: ChannelType;
  code?: string;
  message?: string;
  error?: string;
}
