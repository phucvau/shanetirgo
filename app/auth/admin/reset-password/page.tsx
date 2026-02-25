"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function AdminResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!token) {
      setError("Thiếu token đặt lại mật khẩu.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu mới cần ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Không thể đặt lại mật khẩu.");
      }
      setMessage("Đặt lại mật khẩu thành công. Đang chuyển về trang đăng nhập...");
      window.setTimeout(() => {
        router.push("/auth/admin/login");
      }, 1200);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="bg-background pt-24">
        <section className="mx-auto max-w-xl px-6 pb-16 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Đặt lại mật khẩu admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mật khẩu mới</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Xác nhận mật khẩu mới</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>

              {message ? <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
              {error ? <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p> : null}

              <Button onClick={handleSubmit} disabled={loading} className="w-full bg-black text-white hover:bg-black/90">
                {loading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
              </Button>

              <Link href="/auth/admin/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">
                Quay lại đăng nhập
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-background pt-24" />}>
      <AdminResetPasswordContent />
    </Suspense>
  );
}
