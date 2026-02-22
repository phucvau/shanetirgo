import { NextResponse } from "next/server";

const LOCATION_API_BASE = "https://provinces.open-api.vn/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provinceCode = searchParams.get("provinceCode");

  if (!provinceCode) {
    return NextResponse.json({ message: "provinceCode is required" }, { status: 400 });
  }

  try {
    const response = await fetch(`${LOCATION_API_BASE}/p/${provinceCode}?depth=2`, {
      cache: "no-store",
    });
    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: "Cannot fetch districts", detail: result },
        { status: response.status }
      );
    }

    const districts = Array.isArray(result?.districts)
      ? result.districts.map((item: { code: number; name: string }) => ({
          code: item.code,
          name: item.name,
        }))
      : [];

    return NextResponse.json(districts);
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot fetch districts", error: (error as Error).message },
      { status: 500 }
    );
  }
}
