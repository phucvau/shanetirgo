import { NextResponse } from "next/server";

const LOCATION_API_BASE = "https://provinces.open-api.vn/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const districtCode = searchParams.get("districtCode");

  if (!districtCode) {
    return NextResponse.json({ message: "districtCode is required" }, { status: 400 });
  }

  try {
    const response = await fetch(`${LOCATION_API_BASE}/d/${districtCode}?depth=2`, {
      cache: "no-store",
    });
    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: "Cannot fetch wards", detail: result },
        { status: response.status }
      );
    }

    const wards = Array.isArray(result?.wards)
      ? result.wards.map((item: { code: number; name: string }) => ({
          code: item.code,
          name: item.name,
        }))
      : [];

    return NextResponse.json(wards);
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot fetch wards", error: (error as Error).message },
      { status: 500 }
    );
  }
}
