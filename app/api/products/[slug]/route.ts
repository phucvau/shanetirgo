import { NextResponse } from "next/server";

const serviceUrl = process.env.PRODUCT_SERVICE_URL || "http://localhost:4001";

type RouteContext = {
  params: Promise<{ slug: string }> | { slug: string };
};

export async function GET(_: Request, context: RouteContext) {
  const { slug } = await Promise.resolve(context.params);
  try {
    const response = await fetch(`${serviceUrl}/products/${slug}`, {
      cache: "no-store",
    });

    const result = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { message: result?.message || "Product service unavailable" },
        { status: response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot fetch product detail", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { slug } = await Promise.resolve(context.params);
  try {
    const body = await request.json();
    const response = await fetch(`${serviceUrl}/products/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot update product", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const { slug } = await Promise.resolve(context.params);
  try {
    const response = await fetch(`${serviceUrl}/products/${slug}`, {
      method: "DELETE",
    });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot delete product", error: (error as Error).message },
      { status: 500 }
    );
  }
}
