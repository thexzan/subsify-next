import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export type ApiErrorCode =
  | "bad_request"
  | "unauthorized"
  | "not_found"
  | "conflict"
  | "validation_error"
  | "internal_error";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  bad_request: 400,
  validation_error: 400,
  unauthorized: 401,
  not_found: 404,
  conflict: 409,
  internal_error: 500,
};

export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: unknown,
): NextResponse {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status: STATUS_BY_CODE[code] },
  );
}

export function validationError(error: ZodError): NextResponse {
  const details = error.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
  return apiError("validation_error", "Validation failed", details);
}

export function unauthorized(): NextResponse {
  return apiError("unauthorized", "Authentication required");
}

export function notFound(resource = "Resource"): NextResponse {
  return apiError("not_found", `${resource} not found`);
}

export function internalError(): NextResponse {
  return apiError("internal_error", "Something went wrong");
}
