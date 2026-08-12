'use client';

import { useState, useEffect } from 'react';
import { Clock, Loader2, Train, ArrowRight, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface KrlSchedule {
  trainId: string;
  route: string;
  dest: string;
  depTime: string;
  arrTime: string;
  color: string;
}

interface KrlData {
  station: string;
  upcoming: KrlSchedule[];
  updatedAt: string;
}

export default function KrlScheduleWidget() {
  const [data, setData] = useState<KrlData | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const fetchKrl = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/krl');
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
    fetchKrl();
    const interval = setInterval(fetchKrl, 5 * 60 * 1000); // 5 menit
    return () => clearInterval(interval);
  }, []);

  if (failed) return null;

  if (!data) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="space-y-3 py-4">
          <div className="flex items-center gap-3.5">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky-500/15 ring-1 ring-inset ring-sky-500/20">
              <Train className="size-6 text-sky-500 dark:text-sky-400 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-48 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="h-20 w-full animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    );
  }

  const updatedTime = new Date(data.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3 py-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky-500/15 ring-1 ring-inset ring-sky-500/20">
              <Train className="size-6 text-sky-500 dark:text-sky-400" />
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-lg font-bold tabular-nums">
                Jadwal KRL
                <span className="text-sm font-medium text-muted-foreground">· Stasiun {data.station}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                5 perjalanan berikutnya
                <span className="inline-flex items-center gap-1 ml-1" title="Data diperbarui otomatis">
                  · <Clock className="size-3" /> {updatedTime}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={fetchKrl}
            disabled={loading}
            className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            title="Refresh jadwal"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <RefreshCw className="size-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Daftar 5 KRL berikutnya */}
        <div className="space-y-2">
          {data.upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Tidak ada jadwal KRL lagi hari ini.
            </p>
          ) : (
            data.upcoming.map((krl) => (
              <div
                key={krl.trainId + krl.depTime}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 hover:bg-muted/50 transition-colors"
              >
                {/* Waktu keberangkatan */}
                <div className="text-center shrink-0">
                  <p className="text-lg font-bold tabular-nums leading-none">{krl.depTime.slice(0, 5)}</p>
                  <p className="text-[10px] text-muted-foreground">berangkat</p>
                </div>

                {/* Rute */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{krl.route}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    Tiba {krl.arrTime.slice(0, 5)}
                    <ArrowRight className="size-3" />
                    {krl.dest}
                  </p>
                </div>

                {/* Badge warna rute */}
                <div
                  className="shrink-0 rounded-full px-2 py-1 text-[10px] font-medium text-white"
                  style={{ backgroundColor: krl.color }}
                >
                  {krl.trainId}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}