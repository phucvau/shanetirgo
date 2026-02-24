import { NextResponse } from "next/server";

const serviceUrl = process.env.ORDER_SERVICE_URL || "http://localhost:4002";

type Params = {
  params: Promise<{ id: string }> | { id: string };
};

export async function GET(_: Request, context: Params) {
  try {
    const { id } = await Promise.resolve(context.params);
    const response = await fetch(`${serviceUrl}/orders/${id}`, {
      cache: "no-store",
    });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot fetch order detail", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: Params) {
  try {
    const { id } = await Promise.resolve(context.params);
    const body = await request.json();
    const response = await fetch(`${serviceUrl}/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot update order", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, context: Params) {
  try {
    const { id } = await Promise.resolve(context.params);
    const response = await fetch(`${serviceUrl}/orders/${id}`, {
      method: "DELETE",
    });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot delete order", error: (error as Error).message },
      { status: 500 }
    );
  }
}
