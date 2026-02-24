import { NextResponse } from "next/server";

const serviceUrl = process.env.PRODUCT_SERVICE_URL || "http://localhost:4001";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const response = await fetch(`${serviceUrl}/upload-image`, {
      method: "POST",
      body: formData,
    });

    const text = await response.text();
    let payload: unknown = {};
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text || "Upload failed" };
    }

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot upload image", error: (error as Error).message },
      { status: 500 }
    );
  }
}
