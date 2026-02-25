import { NextResponse } from "next/server";

const orderServiceUrl = process.env.ORDER_SERVICE_URL || "http://localhost:4002";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${orderServiceUrl}/admin-auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot process forgot password", error: (error as Error).message },
      { status: 500 }
    );
  }
}
