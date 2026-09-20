"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Review = { id: number; rating: number; comment: string; createdAt: string };
type RestaurantData = {
  name: string;
  cuisine: string;
  area: string;
  averageRating: number | null;
  totalReviews: number;
  latestReview: Review | null;
  reviews: Review[];
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-rose-600" aria-label={`${rating} out of 5 stars`}>
      {"★★★★★".slice(0, rating)}
      <span className="text-stone-300">{"★★★★★".slice(rating)}</span>
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function LinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-block rounded-full border border-stone-300 px-5 py-2 text-sm font-medium text-stone-800 transition-colors hover:border-rose-600 hover:text-rose-700"
    >
      {children}
    </Link>
  );
}

export default function RestaurantPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = useState<RestaurantData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/restaurants/${id}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Something went wrong.");
        return body as RestaurantData;
      })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <main className="mx-auto w-full max-w-[560px] px-6 py-16 text-center">
        <p className="text-stone-700">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto w-full max-w-[560px] px-6 py-16 text-center">
        <p className="text-stone-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[560px] px-6 py-14">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">{data.name}</h1>
        <p className="mt-1 text-sm text-stone-500">
          {data.cuisine} · {data.area}
        </p>
      </header>

      {/* This line only prints the number the kitchen handed over. No maths here. */}
      <section className="mt-10 flex items-baseline gap-3">
        <p className="text-7xl font-bold tracking-tight text-stone-900">
          {data.averageRating === null ? "—" : data.averageRating}
        </p>
        <p className="text-sm text-stone-500">
          {data.totalReviews === 1 ? "1 review" : `${data.totalReviews} reviews`}
        </p>
      </section>

      {data.latestReview ? (
        <article className="mt-12 rounded-xl border border-rose-200 bg-rose-50/60 p-5">
          <p className="text-xs font-medium uppercase tracking-widest text-rose-700">
            Latest review
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Stars rating={data.latestReview.rating} />
            <time className="text-xs text-stone-500">
              {formatDate(data.latestReview.createdAt)}
            </time>
          </div>
          <p className="mt-2 leading-relaxed text-stone-800">{data.latestReview.comment}</p>
        </article>
      ) : (
        <section className="mt-12 rounded-xl border border-stone-200 p-8 text-center">
          <p className="text-stone-700">No reviews yet — be the first.</p>
          <div className="mt-5">
            <LinkButton href={`/review/${id}`}>Write a review</LinkButton>
          </div>
        </section>
      )}

      {data.reviews.length > 0 && (
        <ul className="mt-6 divide-y divide-stone-200">
          {data.reviews.map((review) => (
            <li key={review.id} className="py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Stars rating={review.rating} />
                <time className="text-xs text-stone-500">{formatDate(review.createdAt)}</time>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-stone-700">{review.comment}</p>
            </li>
          ))}
        </ul>
      )}

      {data.latestReview && (
        <div className="mt-12 text-center">
          <LinkButton href={`/review/${id}`}>Write a review</LinkButton>
        </div>
      )}
    </main>
  );
}