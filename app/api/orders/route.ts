import { NextResponse } from "next/server";

const serviceUrl = process.env.ORDER_SERVICE_URL || "http://localhost:4002";

export async function GET() {
  try {
    const response = await fetch(`${serviceUrl}/orders`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "Order service unavailable" },
        { status: response.status }
      );
    }

    const orders = await response.json();
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot fetch orders", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(`${serviceUrl}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot create order", error: (error as Error).message },
      { status: 500 }
    );
  }
}
