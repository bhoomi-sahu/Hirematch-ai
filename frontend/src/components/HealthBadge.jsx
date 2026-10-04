import React from 'react';
import { Database, Server, RefreshCw, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { useHealthCheck } from '../hooks/useHealthCheck';

const HealthBadge = () => {
  const { data, loading, error, latencyMs, refetch } = useHealthCheck();

  const isHealthy = data?.status === 'healthy';
  const dbConnected = data?.database?.status === 'connected';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-3 w-3">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isHealthy ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                isHealthy ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
          </span>
          <h3 className="font-semibold text-slate-800 text-base">
            System Connectivity Status
          </h3>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="inline-flex items-center space-x-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-md transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading && !data && (
        <div className="py-6 text-center text-sm text-slate-500">
          Checking backend connection...
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-rose-700 text-sm flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
          <div>
            <p className="font-medium">Backend Connection Error</p>
            <p className="text-xs text-rose-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* API Server Status */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-blue-600" />
                Backend API
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  isHealthy
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {data.status.toUpperCase()}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-800 mt-2 truncate">
              Express.js
            </p>
            <span className="text-[11px] text-slate-500">
              Env: {data.environment}
            </span>
          </div>

          {/* Database Status */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                MongoDB
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  dbConnected
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {data.database.status.toUpperCase()}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-800 mt-2 truncate">
              {data.database.name}
            </p>
            <span className="text-[11px] text-slate-500 truncate block">
              Host: {data.database.host}
            </span>
          </div>

          {/* Uptime */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Server Uptime
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-800 mt-2">
              {data.uptimeSeconds}s
            </p>
            <span className="text-[11px] text-slate-500">
              Node {data.system.nodeVersion}
            </span>
          </div>

          {/* Latency */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                API Latency
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-800 mt-2">
              {latencyMs !== null ? `${latencyMs} ms` : 'N/A'}
            </p>
            <span className="text-[11px] text-slate-500">
              RAM: {data.system.memory.heapUsed}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthBadge;
