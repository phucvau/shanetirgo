import { NextResponse } from "next/server";

const serviceUrl = process.env.CATEGORY_SERVICE_URL || "http://localhost:4003";

type Params = {
  params: Promise<{ id: string }> | { id: string };
};

export async function GET(_: Request, context: Params) {
  try {
    const { id } = await Promise.resolve(context.params);
    const response = await fetch(`${serviceUrl}/categories/${id}`, {
      cache: "no-store",
    });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot fetch category", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: Params) {
  try {
    const { id } = await Promise.resolve(context.params);
    const body = await request.json();
    const response = await fetch(`${serviceUrl}/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot update category", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, context: Params) {
  try {
    const { id } = await Promise.resolve(context.params);
    const response = await fetch(`${serviceUrl}/categories/${id}`, {
      method: "DELETE",
    });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot delete category", error: (error as Error).message },
      { status: 500 }
    );
  }
}
