'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

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
}

interface DuesManagementProps {
  records: DuesRecord[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export default function DuesManagement({ records, onApprove, onReject }: DuesManagementProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'unpaid'>('all');

  const filteredRecords = records.filter((r) => {
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

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Manajemen Iuran Bulanan</h3>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('all')}
            >
              Semua
            </Button>
            <Button
              variant={activeTab === 'paid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('paid')}
            >
              Sudah Bayar
            </Button>
            <Button
              variant={activeTab === 'unpaid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('unpaid')}
            >
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
                    Tidak ada data iuran.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{record.houseNumber}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {formatMonth(record.month)} {record.year}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">{formatRupiah(record.amount)}</td>
                    <td className="py-3 pr-4">
                      {record.isPaid ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400">
                          <CheckCircle2 className="size-3 mr-1" /> Lunas
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="size-3 mr-1" /> Belum Bayar
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {record.paymentProofUrl ? (
                        <a
                          href={record.paymentProofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs"
                        >
                          Lihat Bukti
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      {!record.isPaid && onApprove && (
                        <Button size="sm" variant="outline" onClick={() => onApprove(record.id)}>
                          Setujui
                        </Button>
                      )}
                      {record.isPaid && onReject && (
                        <Button size="sm" variant="ghost" onClick={() => onReject(record.id)}>
                          Batalkan
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          Menampilkan {filteredRecords.length} dari {records.length} data iuran.
        </div>
      </CardContent>
    </Card>
  );
}
