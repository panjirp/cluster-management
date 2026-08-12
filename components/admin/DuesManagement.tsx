'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, RotateCcw, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DuesRecord {
  id: string;
  houseId: string;
  houseNumber: string;
  year: number;
  month: number;
  amount: number;
  isPaid: boolean;
  paidAt: string | null;
  paymentProofUrl: string | null;
  neverPaid?: boolean;
}

export default function DuesManagement({ records: initialRecords }: { records: DuesRecord[] }) {
  const [records, setRecords] = useState(initialRecords);
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [months, setMonths] = useState(1);

  const filteredRecords = records.filter((r) => {
    if (r.neverPaid) return false;
    if (activeTab === 'paid') return r.isPaid;
    if (activeTab === 'unpaid') return !r.isPaid;
    return true;
  });

  const formatMonth = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return months[month - 1];
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  async function togglePaid(id: string, setPaid: boolean, numMonths: number) {
    try {
      const res = await fetch('/api/admin/dues/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPaid: setPaid, months: numMonths }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Gagal mengubah status');
        return;
      }

      toast.success(data.message ?? `Status berhasil diubah (${data.affected} bulan)`);
      // Refresh halaman
      window.location.reload();
    } catch {
      toast.error('Terjadi kesalahan. Coba lagi.');
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Manajemen Iuran Bulanan</h3>
          <div className="flex gap-2">
            <Button variant={activeTab === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('all')}>
              Semua
            </Button>
            <Button variant={activeTab === 'paid' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('paid')}>
              Sudah Bayar
            </Button>
            <Button variant={activeTab === 'unpaid' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('unpaid')}>
              Belum Bayar
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4">Rumah</th>
                <th className="py-2 pr-4">Periode</th>
                <th className="py-2 pr-4">Nominal</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Bukti</th>
                <th className="py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Tidak ada data kas.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{record.houseNumber}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{formatMonth(record.month)} {record.year}</td>
                    <td className="py-3 pr-4 tabular-nums">{formatRupiah(record.amount)}</td>
                    <td className="py-3 pr-4">
                      {record.isPaid ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400">
                          <CheckCircle2 className="size-3 mr-1" /> Lunas
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="size-3 mr-1" /> Belum Bayar
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {record.paymentProofUrl ? (
                        <a href={record.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                          Lihat Bukti
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        {!record.isPaid ? (
                          <Dialog>
                            <DialogTrigger>
                              <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50">
                                <Check className="size-3.5 mr-1" /> Tandai Lunas
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-sm">
                              <DialogHeader>
                                <DialogTitle>Tandai Lunas</DialogTitle>
                                <DialogDescription>
                                  {record.houseNumber} — {formatMonth(record.month)} {record.year}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-3 py-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="months">Jumlah bulan yang lunas (ke depan)</Label>
                                  <Input
                                    id="months"
                                    type="number"
                                    min={1}
                                    max={12}
                                    value={months}
                                    onChange={(e) => setMonths(Number(e.target.value))}
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Warga membayar untuk beberapa bulan sekaligus? Pilih jumlah bulan.
                                  </p>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))}>
                                  Batal
                                </Button>
                                <Button onClick={() => togglePaid(record.id, true, months)} className="bg-green-600 hover:bg-green-700">
                                  <Check className="size-3.5 mr-1" /> Konfirmasi Lunas
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Dialog>
                            <DialogTrigger>
                              <Button size="sm" variant="ghost" className="text-amber-600 hover:text-amber-700">
                                <RotateCcw className="size-3.5 mr-1" /> Batal Lunas
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-sm">
                              <DialogHeader>
                                <DialogTitle>Batalkan Status Lunas</DialogTitle>
                                <DialogDescription>
                                  {record.houseNumber} — {formatMonth(record.month)} {record.year}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-4">
                                <p className="text-sm text-muted-foreground">
                                  Batalkan status lunas untuk {months} bulan? Warga akan kembali mendapat notifikasi pembayaran.
                                </p>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))}>
                                  Tidak
                                </Button>
                                <Button variant="destructive" onClick={() => togglePaid(record.id, false, months)}>
                                  Ya, Batalkan
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          Menampilkan {filteredRecords.length} dari {records.filter(r => !r.neverPaid).length} data kas.
        </div>
      </CardContent>
    </Card>
  );
}
