"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      setMessage("Vui lòng nhập tên đăng nhập và mật khẩu.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Đăng nhập thất bại.");
      }
      router.push(nextPath);
      router.refresh();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="bg-background pt-24">
        <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Admin Access</p>
              <h1 className="font-serif text-4xl font-bold text-foreground">Đăng nhập quản trị</h1>
              <p className="max-w-md text-sm text-muted-foreground">
                Khu vực quản trị được bảo vệ. Vui lòng đăng nhập để quản lý sản phẩm, đơn hàng và danh mục.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif text-2xl">
                  <ShieldCheck className="h-6 w-6" /> Admin Login
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Tên đăng nhập</Label>
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleLogin();
                      }
                    }}
                  />
                </div>

                {message ? (
                  <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {message}
                  </p>
                ) : null}

                <Button onClick={handleLogin} disabled={loading} className="w-full bg-black text-white hover:bg-black/90">
                  <Lock className="mr-2 h-4 w-4" />
                  {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>

                <Link href="/auth/admin/forgot-password" className="block text-center text-sm text-muted-foreground hover:text-foreground">
                  Quên mật khẩu?
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
