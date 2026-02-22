import { NextResponse } from "next/server";

const LOCATION_API_BASE = "https://provinces.open-api.vn/api";

export async function GET() {
  try {
    const response = await fetch(`${LOCATION_API_BASE}/p/`, { cache: "no-store" });
    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: "Cannot fetch provinces", detail: result },
        { status: response.status }
      );
    }

    const data = Array.isArray(result)
      ? result.map((item: { code: number; name: string }) => ({
          code: item.code,
          name: item.name,
        }))
      : [];

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot fetch provinces", error: (error as Error).message },
      { status: 500 }
    );
  }
}
