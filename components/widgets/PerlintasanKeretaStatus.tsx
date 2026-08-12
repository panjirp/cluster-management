'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, Loader2, Car, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Arah {
  dari: string;
  ke: string;
  currentSpeed: number;
  freeFlowSpeed: number;
  status: 'lancar' | 'sedang' | 'macet';
}

interface TrafficData {
  overallStatus: 'lancar' | 'sedang' | 'macet';
  keluar: Arah;
  masuk: Arah;
  updatedAt: string;
}

function StatusBadge({ status }: { status: 'lancar' | 'sedang' | 'macet' }) {
  const c = {
    lancar: { icon: CheckCircle, color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950/30', label: 'Lancar' },
    sedang: { icon: Clock, color: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/30', label: 'Padat' },
    macet: { icon: AlertTriangle, color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950/30', label: 'Macet' },
  }[status];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.color}`}>
      <Icon className="size-3" />{c.label}
    </span>
  );
}

function Estimasi({ speed }: { speed: number }) {
  if (speed <= 0) return null;
  const jarak = 1.5; // km
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
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-500/15 ring-1 ring-inset ring-sky-500/20">
              <Car className="size-4 text-sky-500 dark:text-sky-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Lalu Lintas</p>
              <p className="text-xs text-muted-foreground truncate">Gerbang Metland ↔ Masjid At-Taqwa</p>
            </div>
          </div>
          <StatusBadge status={data.overallStatus} />
        </div>

        {/* Dua arah */}
        <div className="grid grid-cols-2 gap-2">
          {([data.keluar, data.masuk] as Arah[]).map((arah, i) => (
            <div key={i} className="rounded-lg border p-2.5 space-y-1.5">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground truncate">{arah.dari}</span>
                <ArrowRight className="size-2.5 shrink-0" />
                <span className="font-medium text-foreground truncate">{arah.ke}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold tabular-nums">{arah.currentSpeed}</span>
                <span className="text-[10px] text-muted-foreground">km/j</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Normal {arah.freeFlowSpeed}</span>
                <StatusBadge status={arah.status} />
              </div>
              <Estimasi speed={arah.currentSpeed} />
            </div>
          ))}
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

        {/* Keterangan monitor */}
        <p className="text-[10px] text-muted-foreground leading-relaxed border-t pt-2.5">
          Hanya monitor 2 ruas jalan dari pintu Gerbang Metland ke Masjid Jami At-Taqwa, dan sebaliknya.
        </p>
      </CardContent>
    </Card>
  );
}
