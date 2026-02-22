"use client"

import { useState } from "react"
import Image from "next/image"
import { Plus, Pencil, Trash2, FolderOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { collections as initialCollections, type Collection } from "@/lib/data"

export default function CollectionsPage() {
  const [collectionList, setCollectionList] = useState<Collection[]>(initialCollections)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Collection | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Collection | null>(null)

  // Form
  const [formTitle, setFormTitle] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formImage, setFormImage] = useState("")

  function openCreate() {
    setEditing(null)
    setFormTitle("")
    setFormDescription("")
    setFormImage("https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80")
    setDialogOpen(true)
  }

  function openEdit(col: Collection) {
    setEditing(col)
    setFormTitle(col.title)
    setFormDescription(col.description)
    setFormImage(col.image)
    setDialogOpen(true)
  }

  function handleSave() {
    const data: Collection = {
      id: editing?.id ?? Date.now(),
      title: formTitle,
      description: formDescription,
      image: formImage,
      href: "#",
      productCount: editing?.productCount ?? 0,
    }
    if (editing) {
      setCollectionList((prev) =>
        prev.map((c) => (c.id === editing.id ? data : c))
      )
    } else {
      setCollectionList((prev) => [...prev, data])
    }
    setDialogOpen(false)
  }

  function handleDelete() {
    if (toDelete) {
      setCollectionList((prev) => prev.filter((c) => c.id !== toDelete.id))
      setDeleteDialogOpen(false)
      setToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Bo suu tap</h1>
          <p className="text-sm text-muted-foreground">
            Quan ly bo suu tap cua hang ({collectionList.length} bo suu tap)
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 size-4" />
          Them bo suu tap
        </Button>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collectionList.map((col) => (
          <Card key={col.id} className="overflow-hidden">
            <div className="relative aspect-[16/10]">
              <Image
                src={col.image}
                alt={col.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-foreground/20" />
              <div className="absolute bottom-4 left-4">
                <h3 className="font-serif text-lg font-bold text-background">
                  {col.title}
                </h3>
              </div>
            </div>
            <CardContent className="pt-4">
              <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                {col.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FolderOpen className="size-3" />
                  {col.productCount} san pham
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => openEdit(col)}
                  >
                    <Pencil className="size-4" />
                    <span className="sr-only">Chinh sua</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                    onClick={() => {
                      setToDelete(col)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Xoa</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editing ? "Chinh sua bo suu tap" : "Them bo suu tap moi"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Cap nhat thong tin bo suu tap."
                : "Tao bo suu tap moi cho cua hang."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Ten bo suu tap</Label>
              <Input
                id="title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Nhap ten bo suu tap"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">Mo ta</Label>
              <Textarea
                id="desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Mo ta bo suu tap..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="img">URL hinh anh</Label>
              <Input
                id="img"
                value={formImage}
                onChange={(e) => setFormImage(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Huy
            </Button>
            <Button onClick={handleSave}>
              {editing ? "Cap nhat" : "Tao moi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Xoa bo suu tap</DialogTitle>
            <DialogDescription>
              Ban co chac chan muon xoa &quot;{toDelete?.title}&quot;? Hanh dong nay khong the hoan tac.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Huy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xoa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
