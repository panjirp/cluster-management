'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, Loader2, Car, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Segment {
  label: string;
  currentSpeed: number;
  freeFlowSpeed: number;
  status: 'lancar' | 'sedang' | 'macet';
}

interface TrafficData {
  overallStatus: 'lancar' | 'sedang' | 'macet';
  dari: string;
  ke: string;
  avgSpeed: number;
  avgFree: number;
  segments: Segment[];
  updatedAt: string;
}

function StatusBadge({ status, small }: { status: 'lancar' | 'sedang' | 'macet'; small?: boolean }) {
  const c = {
    lancar: { icon: CheckCircle, color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950/30', label: 'Lancar' },
    sedang: { icon: Clock, color: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/30', label: 'Padat' },
    macet: { icon: AlertTriangle, color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950/30', label: 'Macet' },
  }[status];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 font-medium ${small ? 'py-0.5 text-[10px]' : 'py-1 text-xs'} ${c.color}`}>
      <Icon className="size-3" />{c.label}
    </span>
  );
}

function Estimasi({ speed, jarak = 1.2 }: { speed: number; jarak?: number }) {
  if (speed <= 0) return null;
  const mobilMnt = Math.max(1, Math.round((jarak / speed) * 60));
  const motorMnt = Math.max(1, Math.round((jarak / (speed * 0.75)) * 60));
  return (
    <p className="text-[10px] text-muted-foreground leading-tight">
      🚗 ±{mobilMnt} mnt · 🏍️ ±{motorMnt} mnt
    </p>
  );
}

export default function TrafficWidget() {
  const [data, setData] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const fetchTraffic = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/traffic');
      if (!res.ok) throw new Error('bad status');
      setData(await res.json());
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
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-500/15">
              <Car className="size-4 text-sky-500 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-3 w-44 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const updatedTime = new Date(data.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const jarak = 1.2; // km antara Daifuku-Metland

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3 py-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-500/15 ring-1 ring-inset ring-sky-500/20">
              <Car className="size-4 text-sky-500 dark:text-sky-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Lalu Lintas</p>
              <p className="text-xs text-muted-foreground truncate">Daifuku → Gerbang Metland</p>
            </div>
          </div>
          <StatusBadge status={data.overallStatus} />
        </div>

        {/* Kecepatan rata-rata */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-2xl font-bold tabular-nums">{data.avgSpeed}</p>
            <p className="text-[10px] text-muted-foreground">km/j rata-rata</p>
          </div>
          <div className="text-right">
            <StatusBadge status={data.overallStatus} small />
            <p className="mt-1 text-[10px] text-muted-foreground">Normal {data.avgFree} km/j</p>
          </div>
        </div>

        {/* Estimated time */}
        <Estimasi speed={data.avgSpeed} jarak={jarak} />

        {/* Segmen rute */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Per Segmen</p>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {data.segments.map((seg, i) => (
              <div key={i} className="flex items-center gap-1.5 shrink-0">
                {i > 0 && <ArrowRight className="size-3 text-muted-foreground/50" />}
                <div className="rounded-lg border px-2 py-1.5 text-center">
                  <p className="text-xs font-semibold tabular-nums">{seg.currentSpeed}</p>
                  <p className="text-[9px] text-muted-foreground">{seg.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            Refresh 5 mnt · <Clock className="size-3 inline" /> {updatedTime}
          </p>
          <button onClick={fetchTraffic} disabled={loading} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <Loader2 className={`size-3.5 ${loading ? 'animate-spin' : ''} text-muted-foreground`} />
          </button>
        </div>

        {/* Keterangan */}
        <p className="text-[10px] text-muted-foreground leading-relaxed border-t pt-2.5">
          Pantau rute dari pintu Daifuku (perlintasan) ke pintu Gerbang Metland, sepanjang ±1,2 km.
        </p>
      </CardContent>
    </Card>
  );
}
