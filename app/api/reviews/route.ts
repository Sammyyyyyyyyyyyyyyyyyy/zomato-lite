import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  let body: {
    restaurantId?: unknown;
    rating?: unknown;
    comment?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { restaurantId, rating, comment } = body;

  // Check 1 of 3: rating must be a whole number from 1 to 5.
  if (!Number.isInteger(rating) || (rating as number) < 1 || (rating as number) > 5) {
    return NextResponse.json(
      { error: "Rating must be a whole number between 1 and 5." },
      { status: 400 }
    );
  }

  // Check 2 of 3: comment must not be empty once whitespace is removed.
  if (typeof comment !== "string" || comment.trim().length === 0) {
    return NextResponse.json({ error: "Comment must not be empty." }, { status: 400 });
  }

  // Check 3 of 3: the restaurant must actually exist (a database lookup).
  const existing = await sql.query("SELECT id FROM restaurants WHERE id = $1", [restaurantId]);
  if (existing.length === 0) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 400 });
  }

  // All checks passed: write exactly one row. RETURNING id hands back the new row's id.
  const inserted = await sql.query(
    "INSERT INTO reviews (restaurant_id, rating, comment) VALUES ($1, $2, $3) RETURNING id",
    [restaurantId, rating, comment.trim()]
  );

  return NextResponse.json({ success: true, reviewId: inserted[0].id }, { status: 201 });
}