'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, Loader2, MapPin, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ArahTraffic {
  dari: string;
  ke: string;
  currentSpeed: number;
  freeFlowSpeed: number;
  status: 'lancar' | 'sedang' | 'macet';
}

interface TrafficData {
  overallStatus: 'lancar' | 'sedang' | 'macet';
  arah1: ArahTraffic;
  arah2: ArahTraffic;
  updatedAt: string;
}

function StatusBadge({ status }: { status: 'lancar' | 'sedang' | 'macet' }) {
  const config = {
    lancar: { icon: CheckCircle, color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950/30', label: 'Lancar' },
    sedang: { icon: Clock, color: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/30', label: 'Padat' },
    macet: { icon: AlertTriangle, color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950/30', label: 'Macet' },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${c.color}`}>
      <Icon className="size-3.5" />
      {c.label}
    </span>
  );
}

export default function PerlintasanKeretaStatus() {
  const [data, setData] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const fetchTraffic = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/traffic');
      if (!res.ok) throw new Error('bad status');
      const d = await res.json();
      setData(d);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraffic();
    const interval = setInterval(fetchTraffic, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (failed) return null;

  if (!data) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="space-y-3 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-500/15 ring-1 ring-inset ring-sky-500/20">
              <MapPin className="size-5 text-sky-500 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="h-3 w-40 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const updatedTime = new Date(data.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3 py-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-500/15 ring-1 ring-inset ring-sky-500/20">
              <MapPin className="size-5 text-sky-500 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-sm font-semibold">Lalu Lintas</p>
              <p className="text-xs text-muted-foreground">Daifuku ↔ Jl. Telaga Asih</p>
            </div>
          </div>
          <StatusBadge status={data.overallStatus} />
        </div>

        {/* Dua arah traffic */}
        <div className="grid grid-cols-2 gap-3">
          {/* Arah 1 */}
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{data.arah1.dari}</span>
              <ArrowRight className="size-3" />
              <span className="font-medium text-foreground">{data.arah1.ke}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold tabular-nums">{data.arah1.currentSpeed}</span>
              <span className="text-xs text-muted-foreground">km/j</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Normal {data.arah1.freeFlowSpeed} km/j</span>
              <StatusBadge status={data.arah1.status} />
            </div>
          </div>

          {/* Arah 2 */}
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{data.arah2.dari}</span>
              <ArrowRight className="size-3" />
              <span className="font-medium text-foreground">{data.arah2.ke}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold tabular-nums">{data.arah2.currentSpeed}</span>
              <span className="text-xs text-muted-foreground">km/j</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Normal {data.arah2.freeFlowSpeed} km/j</span>
              <StatusBadge status={data.arah2.status} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Refresh otomatis 5 menit · <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {updatedTime}</span>
          </p>
          <button
            onClick={fetchTraffic}
            disabled={loading}
            className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <Loader2 className={`size-4 ${loading ? 'animate-spin' : ''} text-muted-foreground`} />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
