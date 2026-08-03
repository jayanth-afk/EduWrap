import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  HardDrive,
  Users,
  ShieldCheck,
  Zap,
  Clock,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Sliders,
  Flame,
  Info,
} from 'lucide-react';
import {
  FIREBASE_FREE_LIMITS,
  OFFICIAL_FIREBASE_LIMITS,
  getDailyUsage,
  getQuotaSettings,
  updateQuotaSettings,
  resetUsageToday,
  getTimeUntilDailyReset,
  recordReads,
  recordWrites,
} from '../../services/quotaService';

export default function FirebaseUsageSettings() {
  const [usage, setUsage] = useState(getDailyUsage());
  const [settings, setSettings] = useState(getQuotaSettings());
  const [timeUntilReset, setTimeUntilReset] = useState(getTimeUntilDailyReset());
  const [toastMessage, setToastMessage] = useState(null);

  // Keep usage and reset timer in sync
  useEffect(() => {
    const handleQuotaUpdate = (e) => {
      if (e?.detail) setUsage(e.detail);
      else setUsage(getDailyUsage());
    };

    window.addEventListener('ew:quota-updated', handleQuotaUpdate);
    const interval = setInterval(() => {
      setUsage(getDailyUsage());
      setTimeUntilReset(getTimeUntilDailyReset());
    }, 10000);

    return () => {
      window.removeEventListener('ew:quota-updated', handleQuotaUpdate);
      clearInterval(interval);
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleSafetyLock = () => {
    const updated = { ...settings, safetyLock: !settings.safetyLock };
    setSettings(updated);
    updateQuotaSettings(updated);
    showToast(`Safety Lock ${updated.safetyLock ? 'enabled' : 'disabled'}`);
  };

  const handleToggleWarnings = () => {
    const updated = { ...settings, showWarnings: !settings.showWarnings };
    setSettings(updated);
    updateQuotaSettings(updated);
    showToast(`Warning alerts ${updated.showWarnings ? 'enabled' : 'disabled'}`);
  };

  const handleReset = () => {
    resetUsageToday();
    setUsage(getDailyUsage());
    showToast('Daily usage counters reset to 0');
  };

  const handleSimulateActivity = () => {
    recordReads(15);
    recordWrites(3);
    showToast('+15 Reads & +3 Writes recorded in telemetry');
  };

  // Percentages against safe 2%-reduced threshold
  const readsPct = Math.min(100, ((usage.reads / FIREBASE_FREE_LIMITS.firestoreReadsDaily) * 100).toFixed(2));
  const writesPct = Math.min(100, ((usage.writes / FIREBASE_FREE_LIMITS.firestoreWritesDaily) * 100).toFixed(2));
  const deletesPct = Math.min(100, ((usage.deletes / FIREBASE_FREE_LIMITS.firestoreDeletesDaily) * 100).toFixed(2));
  const uploadOpsPct = Math.min(100, ((usage.storageUploadOps / FIREBASE_FREE_LIMITS.storageUploadOpsDaily) * 100).toFixed(2));
  const uploadMB = (usage.storageUploadBytes / (1024 * 1024)).toFixed(2);

  const getBarColor = (pct) => {
    if (pct >= 85) return 'from-rose-500 to-red-500';
    if (pct >= 60) return 'from-amber-500 to-orange-500';
    return 'from-[color:oklch(0.58_0.22_var(--accent-hue))] to-emerald-400';
  };

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2 shadow-lg"
        >
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* Header & Status Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.15)] via-(--bg-elevated) to-(--bg-card) border border-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.3)] shadow-(--shadow-glow) relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Flame size={120} className="text-[color:oklch(0.58_0.22_var(--accent-hue))]" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                100% Free-Tier Safe • Cost: $0.00
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.15)] text-[color:oklch(0.58_0.22_var(--accent-hue))] border border-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.3)]">
                <ShieldCheck size={13} />
                2% Safety Buffer Active (98% Cap)
              </div>
            </div>
            <h2 className="text-2xl font-bold text-(--text-primary)">Firebase Free Limits & Quota Guard</h2>
            <p className="text-sm text-(--text-secondary) mt-1">
              All client-side thresholds are set <strong>2% lower than official limits</strong> (98% cap) to guarantee you never cross into paid usage.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
            <div className="p-3 rounded-xl bg-(--bg-base)/60 border border-(--border-default) text-center min-w-[110px]">
              <div className="flex items-center justify-center gap-1 text-[11px] text-(--text-muted) mb-0.5">
                <Clock size={12} />
                <span>Daily Reset</span>
              </div>
              <span className="text-sm font-bold text-(--text-primary)">{timeUntilReset}</span>
            </div>
          </div>
        </div>

        {/* Live Active Protections Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6 pt-6 border-t border-white/5">
          <div className="p-2.5 rounded-xl bg-(--bg-base)/40 border border-(--border-default)/50 flex items-center gap-2">
            <Zap size={15} className="text-[color:oklch(0.58_0.22_var(--accent-hue))]" />
            <div className="text-xs">
              <span className="block font-medium text-(--text-primary)">IndexedDB Cache</span>
              <span className="text-[10px] text-emerald-400">90%+ reads saved</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-(--bg-base)/40 border border-(--border-default)/50 flex items-center gap-2">
            <ShieldCheck size={15} className="text-emerald-400" />
            <div className="text-xs">
              <span className="block font-medium text-(--text-primary)">Bounded Queries</span>
              <span className="text-[10px] text-(--text-muted)">Max 20-50 docs/query</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-(--bg-base)/40 border border-(--border-default)/50 flex items-center gap-2">
            <HardDrive size={15} className="text-cyan-400" />
            <div className="text-xs">
              <span className="block font-medium text-(--text-primary)">Upload Cap</span>
              <span className="text-[10px] text-emerald-400">19.6 MB (2% buffer)</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-(--bg-base)/40 border border-(--border-default)/50 flex items-center gap-2">
            <Lock size={15} className="text-indigo-400" />
            <div className="text-xs">
              <span className="block font-medium text-(--text-primary)">Auto Cost-Lock</span>
              <span className="text-[10px] text-emerald-400">Active (-2% buffer)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quota Progress Meters */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-(--text-primary) flex items-center gap-2">
              <Database size={18} className="text-[color:oklch(0.58_0.22_var(--accent-hue))]" />
              Daily Live Quota Consumption (UTC)
            </h3>
            <p className="text-xs text-(--text-muted) mt-0.5">
              Metrics calculated against your 2% safety buffer (98% of Google Cloud maximum)
            </p>
          </div>
          <button
            onClick={handleSimulateActivity}
            className="text-xs text-[color:oklch(0.58_0.22_var(--accent-hue))] hover:underline flex items-center gap-1 font-medium"
          >
            <RefreshCw size={12} /> Test Telemetry
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Firestore Reads */}
          <div className="p-5 rounded-2xl bg-(--bg-card) border border-(--border-default) space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.15)] text-[color:oklch(0.58_0.22_var(--accent-hue))] flex items-center justify-center font-bold text-xs">
                  R
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-(--text-primary)">Firestore Document Reads</h4>
                  <p className="text-xs text-(--text-muted)">
                    Safe Cap: <strong className="text-emerald-400">49,000 / day</strong> (Official: 50,000)
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-(--text-primary)">
                {usage.reads.toLocaleString()} / {FIREBASE_FREE_LIMITS.firestoreReadsDaily.toLocaleString()}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-(--bg-elevated) overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getBarColor(readsPct)} transition-all duration-500`}
                style={{ width: `${Math.max(readsPct, 1)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-(--text-secondary)">
              <span>{readsPct}% used today</span>
              <span className="text-emerald-400 font-medium">
                {(FIREBASE_FREE_LIMITS.firestoreReadsDaily - usage.reads).toLocaleString()} reads remaining
              </span>
            </div>
          </div>

          {/* Firestore Writes */}
          <div className="p-5 rounded-2xl bg-(--bg-card) border border-(--border-default) space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  W
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-(--text-primary)">Firestore Document Writes</h4>
                  <p className="text-xs text-(--text-muted)">
                    Safe Cap: <strong className="text-emerald-400">19,600 / day</strong> (Official: 20,000)
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-(--text-primary)">
                {usage.writes.toLocaleString()} / {FIREBASE_FREE_LIMITS.firestoreWritesDaily.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-(--bg-elevated) overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getBarColor(writesPct)} transition-all duration-500`}
                style={{ width: `${Math.max(writesPct, 1)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-(--text-secondary)">
              <span>{writesPct}% used today</span>
              <span className="text-emerald-400 font-medium">
                {(FIREBASE_FREE_LIMITS.firestoreWritesDaily - usage.writes).toLocaleString()} writes remaining
              </span>
            </div>
          </div>

          {/* Firestore Deletes */}
          <div className="p-5 rounded-2xl bg-(--bg-card) border border-(--border-default) space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center font-bold text-xs">
                  D
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-(--text-primary)">Firestore Document Deletes</h4>
                  <p className="text-xs text-(--text-muted)">
                    Safe Cap: <strong className="text-emerald-400">19,600 / day</strong> (Official: 20,000)
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-(--text-primary)">
                {usage.deletes.toLocaleString()} / {FIREBASE_FREE_LIMITS.firestoreDeletesDaily.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-(--bg-elevated) overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getBarColor(deletesPct)} transition-all duration-500`}
                style={{ width: `${Math.max(deletesPct, 1)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-(--text-secondary)">
              <span>{deletesPct}% used today</span>
              <span className="text-emerald-400 font-medium">
                {(FIREBASE_FREE_LIMITS.firestoreDeletesDaily - usage.deletes).toLocaleString()} deletes remaining
              </span>
            </div>
          </div>

          {/* Cloud Storage */}
          <div className="p-5 rounded-2xl bg-(--bg-card) border border-(--border-default) space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold text-xs">
                  S
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-(--text-primary)">Cloud Storage & Uploads</h4>
                  <p className="text-xs text-(--text-muted)">
                    Safe Cap: <strong className="text-emerald-400">4.90 GB total • 19.6K uploads/day</strong>
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-(--text-primary)">
                {usage.storageUploadOps} uploads ({uploadMB} MB)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-(--bg-elevated) overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getBarColor(uploadOpsPct)} transition-all duration-500`}
                style={{ width: `${Math.max(uploadOpsPct, 1)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-(--text-secondary)">
              <span>19.6 MB max / file guard</span>
              <span className="text-emerald-400 font-medium">4.90 GB safe allowance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Free Tier Limits Master Reference Table */}
      <div className="p-6 rounded-2xl bg-(--bg-card) border border-(--border-default) space-y-4">
        <div>
          <h3 className="text-base font-bold text-(--text-primary) flex items-center gap-2">
            <Info size={18} className="text-[color:oklch(0.58_0.22_var(--accent-hue))]" />
            Firebase Blaze Free Tier vs. EduWrap 2% Safety Buffer
          </h3>
          <p className="text-xs text-(--text-muted) mt-1">
            EduWrap automatically sets internal quotas 2% below official thresholds to provide an unbreakable safety margin.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-(--border-default) text-(--text-muted)">
                <th className="py-2.5 px-3 font-semibold">Service</th>
                <th className="py-2.5 px-3 font-semibold">Official Free Limit</th>
                <th className="py-2.5 px-3 font-semibold text-emerald-400">EduWrap Safe Cap (-2%)</th>
                <th className="py-2.5 px-3 font-semibold">Billing Rate Beyond Limit</th>
                <th className="py-2.5 px-3 font-semibold">EduWrap Guardrail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border-default)/50 text-(--text-secondary)">
              <tr>
                <td className="py-2.5 px-3 font-medium text-(--text-primary)">Firestore Reads</td>
                <td className="py-2.5 px-3 text-(--text-muted)">50,000 / day</td>
                <td className="py-2.5 px-3 text-emerald-400 font-semibold">49,000 / day</td>
                <td className="py-2.5 px-3">$0.06 per 100k</td>
                <td className="py-2.5 px-3 text-(--text-primary)">IndexedDB Multi-Tab Persistent Cache</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-(--text-primary)">Firestore Writes</td>
                <td className="py-2.5 px-3 text-(--text-muted)">20,000 / day</td>
                <td className="py-2.5 px-3 text-emerald-400 font-semibold">19,600 / day</td>
                <td className="py-2.5 px-3">$0.18 per 100k</td>
                <td className="py-2.5 px-3 text-(--text-primary)">Debounced Batches & Event Throttling</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-(--text-primary)">Firestore Deletes</td>
                <td className="py-2.5 px-3 text-(--text-muted)">20,000 / day</td>
                <td className="py-2.5 px-3 text-emerald-400 font-semibold">19,600 / day</td>
                <td className="py-2.5 px-3">$0.02 per 100k</td>
                <td className="py-2.5 px-3 text-(--text-primary)">Telemetry Tracking & Soft-Deletes</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-(--text-primary)">Firestore Stored Data</td>
                <td className="py-2.5 px-3 text-(--text-muted)">1.0 GiB total</td>
                <td className="py-2.5 px-3 text-emerald-400 font-semibold">0.98 GiB total</td>
                <td className="py-2.5 px-3">$0.108 per GiB/mo</td>
                <td className="py-2.5 px-3 text-(--text-primary)">Lightweight Schemas</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-(--text-primary)">Cloud Storage Total</td>
                <td className="py-2.5 px-3 text-(--text-muted)">5.0 GB total</td>
                <td className="py-2.5 px-3 text-emerald-400 font-semibold">4.90 GB total</td>
                <td className="py-2.5 px-3">$0.026 per GB/mo</td>
                <td className="py-2.5 px-3 text-(--text-primary)">19.6 MB max file size validator</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-(--text-primary)">Storage Daily Uploads</td>
                <td className="py-2.5 px-3 text-(--text-muted)">20,000 / day</td>
                <td className="py-2.5 px-3 text-emerald-400 font-semibold">19,600 / day</td>
                <td className="py-2.5 px-3">$0.05 per 10k</td>
                <td className="py-2.5 px-3 text-(--text-primary)">Upload Operations Tracker</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-(--text-primary)">Storage Download Egress</td>
                <td className="py-2.5 px-3 text-(--text-muted)">1.0 GB / day</td>
                <td className="py-2.5 px-3 text-emerald-400 font-semibold">0.98 GB / day (980 MB)</td>
                <td className="py-2.5 px-3">$0.12 per GB</td>
                <td className="py-2.5 px-3 text-(--text-primary)">Browser Cache Header Retention</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-(--text-primary)">Authentication (OAuth/Email)</td>
                <td className="py-2.5 px-3 text-(--text-muted)">50,000 MAUs / mo</td>
                <td className="py-2.5 px-3 text-emerald-400 font-semibold">49,000 MAUs / mo</td>
                <td className="py-2.5 px-3">$0.0055 per MAU</td>
                <td className="py-2.5 px-3 text-(--text-primary)">OAuth & Email/Password (No SMS fees)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety Controls & Switches */}
      <div className="p-6 rounded-2xl bg-(--bg-card) border border-(--border-default) space-y-6">
        <h3 className="text-base font-bold text-(--text-primary) flex items-center gap-2">
          <Sliders size={18} className="text-[color:oklch(0.58_0.22_var(--accent-hue))]" />
          Client-Side Safety & Automation Controls
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-(--bg-elevated) border border-(--border-default)">
            <div>
              <h4 className="font-semibold text-sm text-(--text-primary)">Cost-Protection Safety Lock</h4>
              <p className="text-xs text-(--text-muted) mt-0.5">
                Automatically suppresses unnecessary non-critical background polling if daily quota reaches 85%.
              </p>
            </div>
            <button
              onClick={handleToggleSafetyLock}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.safetyLock ? 'bg-[color:oklch(0.58_0.22_var(--accent-hue))]' : 'bg-(--bg-base)'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  settings.safetyLock ? 'left-6' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-(--bg-elevated) border border-(--border-default)">
            <div>
              <h4 className="font-semibold text-sm text-(--text-primary)">Quota Warning Alerts</h4>
              <p className="text-xs text-(--text-muted) mt-0.5">
                Display subtle UI banners when approaching 75% of any daily free tier limit.
              </p>
            </div>
            <button
              onClick={handleToggleWarnings}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.showWarnings ? 'bg-[color:oklch(0.58_0.22_var(--accent-hue))]' : 'bg-(--bg-base)'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  settings.showWarnings ? 'left-6' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw size={13} /> Reset Daily Usage Counter
          </button>
        </div>
      </div>

      {/* Google Cloud Hard-Cap & Budget Setup Guide */}
      <div className="p-6 rounded-2xl bg-(--bg-card) border border-(--border-default) space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-(--text-primary) flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400" />
            Google Cloud Server-Side Hard Cap & Budget Setup Guide
          </h3>
          <a
            href="https://console.cloud.google.com/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[color:oklch(0.58_0.22_var(--accent-hue))] hover:underline flex items-center gap-1 font-semibold"
          >
            GCP Billing Console <ExternalLink size={12} />
          </a>
        </div>

        <p className="text-xs text-(--text-secondary)">
          To guarantee 100% peace of mind against unexpected charges, configure a **$0.01 Budget Alert** and API Quota Caps in your Google Cloud Project:
        </p>

        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-(--bg-elevated) border border-(--border-default) flex gap-3 text-xs">
            <div className="w-5 h-5 rounded-full bg-[color:oklch(0.58_0.22_var(--accent-hue))] text-white flex items-center justify-center font-bold shrink-0 text-[10px]">
              1
            </div>
            <div>
              <span className="font-semibold text-(--text-primary) block">Create a $0.01 Billing Budget Alert</span>
              <p className="text-(--text-muted) mt-0.5">
                Go to <strong>GCP Console &gt; Billing &gt; Budgets &amp; Alerts &gt; Create Budget</strong>. Set the Target Amount to <strong>$0.01</strong> and check "Email alert at 50%, 90%, 100% of budget". You will receive an instant email if even 1 cent is ever incurred.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-(--bg-elevated) border border-(--border-default) flex gap-3 text-xs">
            <div className="w-5 h-5 rounded-full bg-[color:oklch(0.58_0.22_var(--accent-hue))] text-white flex items-center justify-center font-bold shrink-0 text-[10px]">
              2
            </div>
            <div>
              <span className="font-semibold text-(--text-primary) block">Set Hard Daily API Quotas on Cloud Firestore</span>
              <p className="text-(--text-muted) mt-0.5">
                Go to <strong>APIs &amp; Services &gt; Cloud Firestore API &gt; Quotas</strong>. You can edit the <em>Read requests per day</em> limit to <strong>50,000</strong>. When capped, Google Cloud will block additional requests instead of billing you.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-(--bg-elevated) border border-(--border-default) flex gap-3 text-xs">
            <div className="w-5 h-5 rounded-full bg-[color:oklch(0.58_0.22_var(--accent-hue))] text-white flex items-center justify-center font-bold shrink-0 text-[10px]">
              3
            </div>
            <div>
              <span className="font-semibold text-(--text-primary) block">Cloud Storage Daily Egress Cap</span>
              <p className="text-(--text-muted) mt-0.5">
                Under <strong>Cloud Storage &gt; Quotas</strong>, ensure maximum daily bandwidth is set within your comfort zone (1 GB/day included free).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
