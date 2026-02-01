'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, Loader, Smartphone, Monitor, AlertTriangle } from 'lucide-react';
import type { PendingDevice, PairedDevice, DevicesResponse } from '@/types/devices';
import { ChannelPairingForm } from './ChannelPairingForm';

interface DevicePairingProps {
  baseUrl: string;
  gatewayToken: string;
  enabledChannels: string[];
}

export function DevicePairing({ baseUrl, gatewayToken, enabledChannels }: DevicePairingProps) {
  const [pending, setPending] = useState<PendingDevice[]>([]);
  const [paired, setPaired] = useState<PairedDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
  const [approvingAll, setApprovingAll] = useState(false);

  const fetchDevices = useCallback(async () => {
    if (!baseUrl || !gatewayToken) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_url: baseUrl, gateway_token: gatewayToken }),
      });

      const data: DevicesResponse = await response.json();

      if (!data.ok) {
        setError(data.error || 'Failed to fetch devices');
        return;
      }

      setPending(data.pending);
      setPaired(data.paired);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setLoading(false);
    }
  }, [baseUrl, gatewayToken]);

  const approveDevice = async (requestId: string) => {
    setApprovingIds(prev => new Set(prev).add(requestId));

    try {
      const response = await fetch(`/api/devices/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_url: baseUrl, gateway_token: gatewayToken }),
      });

      const data = await response.json();

      if (data.ok && data.success) {
        await fetchDevices();
      } else {
        setError(data.error || 'Failed to approve device');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setApprovingIds(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const approveAll = async () => {
    setApprovingAll(true);

    try {
      const response = await fetch('/api/devices/approve-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_url: baseUrl, gateway_token: gatewayToken }),
      });

      const data = await response.json();

      if (data.ok) {
        await fetchDevices();
      } else {
        setError(data.error || 'Failed to approve devices');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve all');
    } finally {
      setApprovingAll(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getDeviceIcon = (platform?: string) => {
    if (platform?.toLowerCase().includes('mobile') || platform?.toLowerCase().includes('phone')) {
      return <Smartphone className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  if (!baseUrl || !gatewayToken) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Configuration Required</h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Please complete the previous steps to configure your Moltworker URL and Gateway Token before pairing devices.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Channel Pairing Section */}
      <ChannelPairingForm
        baseUrl={baseUrl}
        gatewayToken={gatewayToken}
        enabledChannels={enabledChannels}
      />

      {/* Separator if channels are enabled */}
      {enabledChannels.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 my-6" />
      )}

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchDevices}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Pending Devices */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Pending Requests ({pending.length})
          </h4>
          {pending.length > 1 && (
            <button
              onClick={approveAll}
              disabled={approvingAll}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50"
            >
              {approvingAll ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Approve All
            </button>
          )}
        </div>

        {loading && pending.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : pending.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No pending pairing requests
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Devices will appear here when they try to connect
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((device) => (
              <div
                key={device.requestId}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="text-gray-400">
                    {getDeviceIcon(device.platform)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {device.displayName || device.deviceId}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {[device.platform, device.clientMode, device.remoteIp].filter(Boolean).join(' • ')}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Requested: {formatTime(device.ts)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => approveDevice(device.requestId)}
                  disabled={approvingIds.has(device.requestId)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
                >
                  {approvingIds.has(device.requestId) ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Approve
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paired Devices */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Paired Devices ({paired.length})
        </h4>

        {paired.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No paired devices yet
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {paired.map((device) => (
              <div
                key={device.deviceId}
                className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <div className="text-green-500">
                  {getDeviceIcon(device.platform)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {device.displayName || device.deviceId}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {[device.platform, device.clientMode].filter(Boolean).join(' • ')}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Approved: {formatTime(device.approvedAtMs)}
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
