import { NextResponse } from "next/server";

const serviceUrl = process.env.COLLECTION_SERVICE_URL || "http://localhost:4004";

type Params = {
  params: Promise<{ id: string }> | { id: string };
};

export async function GET(_: Request, context: Params) {
  try {
    const { id } = await Promise.resolve(context.params);
    const response = await fetch(`${serviceUrl}/collections/${id}`, {
      cache: "no-store",
    });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot fetch collection", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: Params) {
  try {
    const { id } = await Promise.resolve(context.params);
    const body = await request.json();
    const response = await fetch(`${serviceUrl}/collections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot update collection", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, context: Params) {
  try {
    const { id } = await Promise.resolve(context.params);
    const response = await fetch(`${serviceUrl}/collections/${id}`, {
      method: "DELETE",
    });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot delete collection", error: (error as Error).message },
      { status: 500 }
    );
  }
}
