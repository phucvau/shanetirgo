import { NextResponse } from "next/server";

const serviceUrl = process.env.CATEGORY_SERVICE_URL || "http://localhost:4003";

export async function GET() {
  try {
    const response = await fetch(`${serviceUrl}/categories`, {
      cache: "no-store",
    });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot fetch categories", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${serviceUrl}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot create category", error: (error as Error).message },
      { status: 500 }
    );
  }
}
