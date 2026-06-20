import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { AppError } from '@/core/errors/app-error';
import { fail } from './responses';
import { env } from '@/core/config/env';

type RouteHandler = (...args: never[]) => Promise<NextResponse> | NextResponse;

/**
 * Wraps a route handler with centralized error translation so every API
 * route returns a consistent error envelope.
 */
export function route<H extends RouteHandler>(handler: H): H {
  return (async (...args: Parameters<H>) => {
    try {
      return await handler(...args);
    } catch (err) {
      return translateError(err);
    }
  }) as H;
}

function translateError(err: unknown): NextResponse {
  if (err instanceof AppError) {
    return fail(err.statusCode, err.code, err.message, err.details);
  }

  if (err instanceof ZodError) {
    return fail(422, 'VALIDATION_ERROR', 'Validation failed', err.flatten());
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return fail(409, 'CONFLICT', 'A record with these values already exists');
    }
    if (err.code === 'P2025') {
      return fail(404, 'NOT_FOUND', 'Requested record was not found');
    }
  }

  if (env.NODE_ENV !== 'production') {
    console.error('[UnhandledError]', err);
  }

  return fail(500, 'INTERNAL_SERVER_ERROR', 'Something went wrong');
}
