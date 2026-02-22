import { NextResponse } from "next/server";

const serviceUrl = process.env.PRODUCT_SERVICE_URL || "http://localhost:4001";

export async function GET() {
  try {
    const response = await fetch(`${serviceUrl}/products`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "Product service unavailable" },
        { status: response.status }
      );
    }

    const products = await response.json();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot fetch products", error: (error as Error).message },
      { status: 500 }
    );
  }
}
