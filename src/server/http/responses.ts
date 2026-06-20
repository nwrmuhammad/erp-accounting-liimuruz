import { NextResponse } from 'next/server';

interface SuccessEnvelope<T> {
  success: true;
  data: T;
}

interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json<SuccessEnvelope<T>>({ success: true, data }, init);
}

export function created<T>(data: T): NextResponse {
  return ok(data, { status: 201 });
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function fail(
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): NextResponse {
  return NextResponse.json<ErrorEnvelope>(
    { success: false, error: { code, message, details } },
    { status: statusCode },
  );
}
