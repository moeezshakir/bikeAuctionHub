import { NextResponse } from "next/server";

export function ok(payload, status = 200) {
  return NextResponse.json(payload, { status });
}

export function fail(message, status = 400, details = undefined) {
  return NextResponse.json(
    {
      status: false,
      error: message,
      ...(details ? { details } : {}),
    },
    { status }
  );
}

export function generateOtp() {
  return String(Math.floor(10000 + Math.random() * 90000));
}
