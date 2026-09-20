import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// Always compute at request time — never cache this endpoint.
export const dynamic = "force-dynamic";

function toReviewDto(row: { id: number; rating: number; comment: string; created_at: string }) {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const restaurantId = Number.parseInt(id, 10);
  if (Number.isNaN(restaurantId)) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  const restaurantResult = await sql.query(
    "SELECT name, cuisine, area FROM restaurants WHERE id = $1",
    [restaurantId]
  );
  if (restaurantResult.length === 0) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }
  const restaurant = restaurantResult[0] as { name: string; cuisine: string; area: string };

  // The two calculations live here, in the kitchen: AVG and COUNT, run fresh.
  const statsResult = await sql.query(
    "SELECT COUNT(*)::int AS count, ROUND(AVG(rating)::numeric, 1)::float8 AS avg FROM reviews WHERE restaurant_id = $1",
    [restaurantId]
  );
  const totalReviews = statsResult[0].count as number;
  const averageRating =
    statsResult[0].avg === null ? null : Number(statsResult[0].avg);

  // The sort also lives here: newest first. The frontend never sorts.
  const reviewsResult = await sql.query(
    "SELECT id, rating, comment, created_at FROM reviews WHERE restaurant_id = $1 ORDER BY created_at DESC, id DESC",
    [restaurantId]
  );

  // Newest review is shown separately on the page, so the list excludes it.
  const latestReview =
    reviewsResult.length > 0 ? toReviewDto(reviewsResult[0]) : null;
  const reviews = reviewsResult.slice(1).map(toReviewDto);

  return NextResponse.json({
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    area: restaurant.area,
    averageRating,
    totalReviews,
    latestReview,
    reviews,
  });
}