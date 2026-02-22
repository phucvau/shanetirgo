"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  const [storeName, setStoreName] = useState("LUXE")
  const [storeDescription, setStoreDescription] = useState(
    "Kham pha bo suu tap thoi trang hien dai, sang trong va tinh te."
  )
  const [email, setEmail] = useState("contact@luxe.vn")
  const [phone, setPhone] = useState("0912 345 678")
  const [address, setAddress] = useState("123 Nguyen Hue, Quan 1, TP. Ho Chi Minh")
  const [enableNotifications, setEnableNotifications] = useState(true)
  const [enableMaintenance, setEnableMaintenance] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Cai dat</h1>
        <p className="text-sm text-muted-foreground">
          Quan ly cau hinh cua hang
        </p>
      </div>

      {/* Store Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thong tin cua hang</CardTitle>
          <CardDescription>Thong tin co ban ve cua hang cua ban</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="store-name">Ten cua hang</Label>
            <Input
              id="store-name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="store-desc">Mo ta</Label>
            <Textarea
              id="store-desc"
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thong tin lien he</CardTitle>
          <CardDescription>Cach khach hang co the lien he voi ban</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Dien thoai</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Dia chi</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tuy chon</CardTitle>
          <CardDescription>Cac tuy chon cau hinh them</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Thong bao email</p>
              <p className="text-xs text-muted-foreground">
                Nhan thong bao khi co don hang moi
              </p>
            </div>
            <Switch
              checked={enableNotifications}
              onCheckedChange={setEnableNotifications}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Che do bao tri</p>
              <p className="text-xs text-muted-foreground">
                Tam thoi dong cua hang de bao tri
              </p>
            </div>
            <Switch
              checked={enableMaintenance}
              onCheckedChange={setEnableMaintenance}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Save */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave}>
          {saved ? "Da luu!" : "Luu thay doi"}
        </Button>
        {saved && (
          <p className="text-sm text-muted-foreground">
            Cai dat da duoc luu thanh cong.
          </p>
        )}
      </div>
    </div>
  )
}
