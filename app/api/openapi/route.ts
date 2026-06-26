import { NextResponse } from "next/server";
import { buildOpenApiDocument } from "@/lib/openapi";

// Public: the spec is a contract, contains no secrets, and codegen tools and
// the docs viewer need to fetch it without authentication.
export function GET() {
  return NextResponse.json(buildOpenApiDocument());
}
