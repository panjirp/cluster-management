'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, Loader2, MapPin, Car } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface TrafficData {
  status: 'lancar' | 'sedang' | 'macet';
  currentSpeed: number;
  freeFlowSpeed: number;
  confidence: number;
  roadClosure: boolean;
  ratio: number;
  coordinates: { latitude: number; longitude: number }[];
  point: { lat: number; lon: number };
  roadName: string;
  updatedAt: string;
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

  const handleRefresh = () => fetchTraffic();

  const getStatusColor = () => {
    if (!data) return 'text-muted-foreground bg-muted';
    switch (data.status) {
      case 'macet':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950/30';
      case 'sedang':
        return 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/30';
      default:
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950/30';
    }
  };

  const getStatusIcon = () => {
    if (!data) return <MapPin className="w-5 h-5" />;
    switch (data.status) {
      case 'macet':
        return <AlertTriangle className="w-5 h-5" />;
      case 'sedang':
        return <Clock className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getStatusText = () => {
    if (!data) return 'Memuat...';
    if (data.roadClosure) return 'Jalan Tutup';
    switch (data.status) {
      case 'macet':
        return 'Macet';
      case 'sedang':
        return 'Padat Merayap';
      default:
        return 'Lancar';
    }
  };

  // TomTom map URL — embed peta dengan traffic layer
  const mapUrl = data
    ? `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/12/${ Math.floor((data.point.lon + 180) / 360 * 4096)}/${ Math.floor((1 - Math.log(Math.tan(data.point.lat * Math.PI / 180) + 1 / Math.cos(data.point.lat * Math.PI / 180)) / Math.PI) / 2 * 4096)}/256.png?key=${process.env.NEXT_PUBLIC_TOMTOM_KEY || ''}&thickness=2`
    : null;

  // Alternatif: pakai static map dengan marker
  const staticMapUrl = `https://api.tomtom.com/map/1/staticimage?key=Bfe5LFWFhJzLBCBek0KyFSHt2UBFUvYj&zoom=15&center=107.1010,-6.2590&format=jpg&layer=basic&style=night&width=600&height=200`;

  if (failed) return null;

  if (!data) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="space-y-3 py-4">
          <div className="flex items-center gap-3.5">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky-500/15 ring-1 ring-inset ring-sky-500/20">
              <MapPin className="size-6 text-sky-500 dark:text-sky-400 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-48 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="h-32 w-full animate-pulse rounded-lg bg-muted" />
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
              <MapPin className="size-6 text-sky-500 dark:text-sky-400" />
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-lg font-bold tabular-nums">
                Perlintasan Kereta
                <span className="text-sm font-medium text-muted-foreground">· {data.roadName}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Status lalu lintas dekat cluster
                <span className="inline-flex items-center gap-1 ml-1" title="Data diperbarui otomatis">
                  · <Clock className="size-3" /> {updatedTime}
                </span>
              </p>
            </div>
          </div>

          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor()}`}>
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>
        </div>

        {/* Peta statis dari TomTom */}
        <div className="relative w-full overflow-hidden rounded-lg border border-border">
          <img
            src={staticMapUrl}
            alt="Peta perlintasan kereta"
            className="w-full h-32 object-cover"
            loading="lazy"
          />
          {/* Overlay status */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1.5">
            <Car className="size-3.5 text-white" />
            <span className="text-xs font-medium text-white">
              {data.currentSpeed} km/j
            </span>
            <span className="text-xs text-white/60">/ {data.freeFlowSpeed} km/j normal</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Kecepatan: {data.currentSpeed} km/j · Normal: {data.freeFlowSpeed} km/j
          </p>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            title="Refresh status"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <Clock className="size-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}