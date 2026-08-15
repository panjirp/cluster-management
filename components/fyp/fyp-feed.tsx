"use client";

import { useState, useCallback, useEffect } from "react";
import { Heart, MessageCircle, Send, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type Comment = { id: string; content: string; user: string; house?: string | null };
type Photo = {
  id: string;
  filePath: string;
  caption: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  uploadedBy: { name: string; house?: { blockNumber: string } | null };
  comments: Comment[];
};

export function FypFeed() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const loadPhotos = useCallback(async () => {
    try {
      const res = await fetch("/api/gallery");
      if (res.ok) setPhotos(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Pilih foto dulu.");
      return;
    }
    setUploading(true);
    try {
      // 1) upload file
      const fd = new FormData();
      fd.append("file", file);
      const upRes = await fetch("/api/uploads", { method: "POST", body: fd });
      if (!upRes.ok) throw new Error("upload gagal");
      const { url } = await upRes.json();

      // 2) buat record galeri
      const galRes = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: url, caption: caption.trim() || undefined }),
      });
      if (!galRes.ok) throw new Error("gagal simpan");

      toast.success("Foto terunggah!");
      setFile(null);
      setCaption("");
      loadPhotos();
    } catch {
      toast.error("Gagal mengunggah foto.");
    } finally {
      setUploading(false);
    }
  }

  async function toggleLike(photoId: string) {
    try {
      const res = await fetch(`/api/gallery/${photoId}/like`, { method: "POST" });
      if (res.ok) {
        const { liked } = await res.json();
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId
              ? { ...p, likedByMe: liked, likeCount: p.likeCount + (liked ? 1 : -1) }
              : p
          )
        );
      }
    } catch {
      // silent
    }
  }

  async function addComment(photoId: string, content: string) {
    if (!content.trim()) return;
    try {
      const res = await fetch(`/api/gallery/${photoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const c = await res.json();
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId
              ? { ...p, comments: [...p.comments, c], commentCount: p.commentCount + 1 }
              : p
          )
        );
      }
    } catch {
      // silent
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload form */}
      <Card>
        <CardContent className="space-y-3 py-4">
          <div className="flex items-center gap-2">
            <Camera className="size-5 text-primary" />
            <h2 className="font-semibold tracking-tight">Unggah Momen</h2>
          </div>
          <form onSubmit={handleUpload} className="space-y-3">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="cursor-pointer"
            />
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Tulis caption (opsional)..."
            />
            <Button type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Mengunggah...
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : photos.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <p className="font-semibold">Belum ada foto</p>
            <p className="text-sm text-muted-foreground">Unggah momen pertamamu di atas!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {photos.map((p) => (
            <FypCard key={p.id} photo={p} onLike={toggleLike} onComment={addComment} />
          ))}
        </div>
      )}
    </div>
  );
}

function FypCard({
  photo,
  onLike,
  onComment,
}: {
  photo: Photo;
  onLike: (id: string) => void;
  onComment: (id: string, content: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [showComments, setShowComments] = useState(false);

  function submitComment(e: React.FormEvent) {
    e.preventDefault();
    onComment(photo.id, draft);
    setDraft("");
  }

  return (
    <Card className="overflow-hidden">
      <div className="aspect-[4/3] w-full overflow-hidden bg-black/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.filePath} alt={photo.caption ?? "Foto warga"} className="h-full w-full object-cover" />
      </div>
      <CardContent className="space-y-3 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{photo.uploadedBy.name}</span>
          {photo.uploadedBy.house?.blockNumber ? <span>· {photo.uploadedBy.house.blockNumber}</span> : null}
        </div>
        {photo.caption && <p className="text-sm">{photo.caption}</p>}

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onLike(photo.id)}
            className="flex items-center gap-1.5 text-sm transition-colors hover:text-red-500"
          >
            <Heart
              className={`size-5 ${photo.likedByMe ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
            />
            {photo.likeCount}
          </button>
          <button
            onClick={() => setShowComments((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <MessageCircle className="size-5" />
            {photo.commentCount}
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="space-y-2 border-t pt-2">
            {photo.comments.length === 0 ? (
              <p className="text-xs text-muted-foreground">Belum ada komentar.</p>
            ) : (
              photo.comments.map((c) => (
                <div key={c.id} className="text-sm">
                  <span className="font-medium">{c.user}</span>
                  {c.house ? <span className="text-xs text-muted-foreground"> · {c.house}</span> : null}
                  <span className="text-muted-foreground">: {c.content}</span>
                </div>
              ))
            )}
            <form onSubmit={submitComment} className="flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Tulis komentar..."
                className="h-8 text-sm"
              />
              <button type="submit" className="shrink-0 text-primary" aria-label="Kirim komentar">
                <Send className="size-4" />
              </button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
