"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

export default function ReviewPage() {
  const params = useParams<{ restaurantId: string }>();
  const restaurantId = params.restaurantId;
  const router = useRouter();

  const [restaurant, setRestaurant] = useState<{
    name: string;
    cuisine: string;
    area: string;
  } | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/restaurants/${restaurantId}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Something went wrong.");
        setRestaurant(body);
      })
      .catch(() => setRestaurant(null));
  }, [restaurantId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: Number(restaurantId), rating, comment }),
      });
      const body = await res.json();
      if (!res.ok) {
        // Show the backend's own words, not a message we invented.
        setError(body.error || "Something went wrong.");
        setSubmitting(false);
        return;
      }
      router.push(`/restaurant/${restaurantId}`);
    } catch {
      setError("Could not reach the server.");
      setSubmitting(false);
    }
  }

  const canSubmit = rating > 0 && comment.trim().length > 0 && !submitting;

  return (
    <main className="mx-auto w-full max-w-[560px] px-6 py-14">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          {restaurant ? restaurant.name : "Write a review"}
        </h1>
        {restaurant && (
          <p className="mt-1 text-sm text-stone-500">
            {restaurant.cuisine} · {restaurant.area}
          </p>
        )}
      </header>

      <form onSubmit={handleSubmit} className="mt-10 space-y-8">
        <fieldset>
          <legend className="text-sm font-medium text-stone-800">Your rating</legend>
          <div className="mt-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`${value} star${value > 1 ? "s" : ""}`}
                onClick={() => setRating(value)}
                onMouseEnter={() => setHover(value)}
                onMouseLeave={() => setHover(0)}
                className={`text-4xl leading-none transition-colors ${
                  (hover || rating) >= value ? "text-amber-600" : "text-stone-300"
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="text-sm font-medium text-stone-800">Your review</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="What did you think?"
            className="mt-3 w-full rounded-xl border border-stone-300 bg-white p-4 text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none"
          />
        </label>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
        >
          {submitting ? "Sending…" : "Submit review"}
        </button>
      </form>
    </main>
  );
}