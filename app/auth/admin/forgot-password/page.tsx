"use client";

import Link from "next/link";
import { useState } from "react";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("phucvau16032003@gmail.com");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!email.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Không thể gửi email đặt lại mật khẩu.");
      }
      setMessage(result?.message || "Nếu email tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu.");
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
              <CardTitle className="font-serif text-2xl">Quên mật khẩu admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email quản trị</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@email.com" />
              </div>

              {message ? <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
              {error ? <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p> : null}

              <Button onClick={handleSubmit} disabled={loading} className="w-full bg-black text-white hover:bg-black/90">
                {loading ? "Đang gửi..." : "Gửi email đặt lại mật khẩu"}
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
