import { NextResponse } from "next/server";

const serviceUrl = process.env.PRODUCT_SERVICE_URL || "http://localhost:4001";

type RouteContext = {
  params: Promise<{ slug: string }> | { slug: string };
};

export async function PATCH(request: Request, context: RouteContext) {
  const { slug } = await Promise.resolve(context.params);
  try {
    const body = await request.json();
    const response = await fetch(`${serviceUrl}/products/${slug}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot update product status", error: (error as Error).message },
      { status: 500 }
    );
  }
}
