import { NextResponse } from "next/server";

const serviceUrl = process.env.COLLECTION_SERVICE_URL || "http://localhost:4004";

export async function GET() {
  try {
    const response = await fetch(`${serviceUrl}/collections`, { cache: "no-store" });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot fetch collections", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${serviceUrl}/collections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot create collection", error: (error as Error).message },
      { status: 500 }
    );
  }
}
