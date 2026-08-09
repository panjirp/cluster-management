"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Phone, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { EditDirectoryMemberDialog } from "@/components/directory/edit-directory-member-dialog";
import { buildWaLink } from "@/lib/whatsapp";
import {
	shiftStatusValues,
	shiftStatusLabels,
	type ShiftStatusValue,
} from "@/lib/validations/directory";

export type DirectoryMemberRow = {
	id: string;
	roleType: "PENGURUS" | "SATPAM";
	position: string;
	fullName: string;
	phone: string;
	photoUrl: string | null;
	scheduleShift: ShiftStatusValue | null;
};

const avatarStyle: Record<DirectoryMemberRow["roleType"], string> = {
	PENGURUS: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
	SATPAM: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
};

const shiftStyle: Record<ShiftStatusValue, string> = {
	PAGI: "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400",
	SIANG:
		"border-transparent bg-orange-500/15 text-orange-700 dark:text-orange-400",
	MALAM:
		"border-transparent bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
	OFF: "border-transparent bg-muted text-muted-foreground",
};

function initials(name: string) {
	const parts = name.trim().split(/\s+/);
	return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function DirectoryMemberCard({
	member,
	canManage,
}: {
	member: DirectoryMemberRow;
	canManage: boolean;
}) {
	const router = useRouter();
	const [detailOpen, setDetailOpen] = useState(false);

	const roleLabel = member.roleType === "SATPAM" ? "Satpam" : "Pengurus";

	async function updateShift(shift: string) {
		const res = await fetch(`/api/directory/${member.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ scheduleShift: shift }),
		});
		if (!res.ok) {
			toast.error("Gagal memperbarui shift.");
			return;
		}
		router.refresh();
	}

	async function handleDelete() {
		const res = await fetch(`/api/directory/${member.id}`, {
			method: "DELETE",
		});

		if (!res.ok) {
			toast.error("Gagal menghapus anggota.");
			return;
		}

		toast.success("Anggota dihapus dari direktori.");
		router.refresh();
	}

	return (
		<Card>
			<CardContent className="flex items-center gap-4">
				<Dialog open={detailOpen} onOpenChange={setDetailOpen}>
					{/* Klik area profil → detail penuh */}
					<DialogTrigger
						render={
							<div className="flex min-w-0 flex-1 cursor-pointer items-center gap-4 select-none">
								{member.photoUrl ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img
										src={member.photoUrl}
										alt={member.fullName}
										className="size-12 shrink-0 rounded-full object-cover"
									/>
								) : (
									<div
										className={`grid size-12 shrink-0 place-items-center rounded-full text-sm font-semibold ${avatarStyle[member.roleType]}`}
									>
										{initials(member.fullName)}
									</div>
								)}
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium">{member.fullName}</p>
									<p className="truncate text-sm text-muted-foreground">
										{member.position}
									</p>
									{member.roleType === "SATPAM" && member.scheduleShift && (
										<Badge
											variant="outline"
											className={`mt-1 ${shiftStyle[member.scheduleShift]}`}
										>
											{shiftStatusLabels[member.scheduleShift]}
										</Badge>
									)}
								</div>
							</div>
						}
					/>

					{/* Detail penuh */}
					<DialogContent>
						<DialogHeader>
							<DialogTitle className="sr-only">Detail {member.fullName}</DialogTitle>
							<DialogDescription className="sr-only">
								Detail kontak {member.fullName}
							</DialogDescription>
						</DialogHeader>
						<div className="flex flex-col items-center gap-3 pt-2 text-center">
							{member.photoUrl ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={member.photoUrl}
									alt={member.fullName}
									className="size-24 rounded-full object-cover ring-2 ring-primary/20"
								/>
							) : (
								<div
									className={`grid size-24 place-items-center rounded-full text-2xl font-semibold ${avatarStyle[member.roleType]}`}
								>
									{initials(member.fullName)}
								</div>
							)}
							<div className="space-y-1">
								<h3 className="text-lg font-semibold">{member.fullName}</h3>
								<div className="flex flex-wrap items-center justify-center gap-2">
									<Badge variant="secondary">{roleLabel}</Badge>
									<span className="text-sm text-muted-foreground">{member.position}</span>
									{member.roleType === "SATPAM" && member.scheduleShift && (
										<Badge
											variant="outline"
											className={shiftStyle[member.scheduleShift]}
										>
											{shiftStatusLabels[member.scheduleShift]}
										</Badge>
									)}
								</div>
							</div>
						</div>

						<div className="rounded-lg border p-3">
							<p className="mb-1 text-xs font-medium text-muted-foreground">
								Nomor WhatsApp / Telepon
							</p>
							{/* Nomor bisa diklik → redirect ke WhatsApp */}
							<a
								href={buildWaLink(member.phone)}
								target="_blank"
								rel="noopener noreferrer"
								className="font-medium text-primary underline-offset-4 hover:underline"
							>
								{member.phone}
							</a>
						</div>

						<div className="grid grid-cols-2 gap-2">
							<Button
								variant="outline"
								render={
									<a href={`tel:${member.phone}`}>
										<Phone data-icon="inline-start" />
										Telepon
									</a>
								}
							/>
							<Button
								render={
									<a
										href={buildWaLink(member.phone)}
										target="_blank"
										rel="noopener noreferrer"
									>
										<MessageCircle data-icon="inline-start" />
										Chat WhatsApp
									</a>
								}
							/>
						</div>
					</DialogContent>
				</Dialog>
				<div className="flex shrink-0 flex-col items-end gap-2">
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							render={
								<a href={`tel:${member.phone}`}>
									<Phone data-icon="inline-start" />
									Telepon
								</a>
							}
						/>
						<Button
							variant="outline"
							size="sm"
							render={
								<a
									href={buildWaLink(member.phone)}
									target="_blank"
									rel="noopener noreferrer"
								>
									<MessageCircle data-icon="inline-start" />
									WhatsApp
								</a>
							}
						/>
					</div>
					{canManage && (
						<div className="flex items-center gap-1">
							{member.roleType === "SATPAM" && (
								<Select
									items={shiftStatusLabels}
									value={member.scheduleShift}
									onValueChange={(v) => v && updateShift(v)}
								>
									<SelectTrigger size="sm" className="w-32">
										<SelectValue placeholder="Set shift" />
									</SelectTrigger>
									<SelectContent>
										{shiftStatusValues.map((value) => (
											<SelectItem key={value} value={value}>
												{shiftStatusLabels[value]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
							<EditDirectoryMemberDialog member={member} />
							<ConfirmDeleteButton
								title={`Hapus ${member.fullName}?`}
								description="Anggota ini akan dihapus dari direktori."
								onConfirm={handleDelete}
							/>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
