import { NextResponse } from "next/server";

const serviceUrl = process.env.PRODUCT_SERVICE_URL || "http://localhost:4001";

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

export async function GET(_: Request, context: RouteContext) {
  const { id } = await Promise.resolve(context.params);
  try {
    const response = await fetch(`${serviceUrl}/products/id/${id}`, {
      cache: "no-store",
    });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot fetch product by id", error: (error as Error).message },
      { status: 500 }
    );
  }
}
