"use client";

import Link from "next/link";
import { Star, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";
import { call } from "@/lib/http";

type Review = { id: string; rating: number; comment: string; created_at: string; reviewer_name?: string };
type Reviews = { items: Review[]; total: number; average_rating: number | null; can_review: boolean; review: Review | null; reason: string };

export function ProductReviews({ slug }: { slug: string }) {
  const { user, ready } = useAuth();
  const [data, setData] = useState<Reviews | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const path = `/api/products/${encodeURIComponent(slug)}/reviews`;

  useEffect(() => {
    if (!reviewOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [reviewOpen]);

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    void call<Reviews>(path, { signal: controller.signal }).then((result) => {
      if (controller.signal.aborted) return;
      if (!result.ok || !result.data.can_review) {
        dialog.current?.close();
        setReviewOpen(false);
      }
      setData(result.ok ? result.data : null);
      setError(result.ok ? null : result.error);
      setSaved(false);
    });
    return () => controller.abort();
  }, [path, ready, user?.id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !data?.can_review) return;
    setBusy(true);
    setError(null);
    const result = await call<Review & { total: number; average_rating: number }>(path, { method: "POST", body: { rating, comment: comment.trim() } });
    if (result.ok) {
      dialog.current?.close();
      setReviewOpen(false);
      const review = { ...result.data, reviewer_name: "You" };
      setData((previous) => previous ? { ...previous, can_review: false, reason: "already_reviewed", review,
        items: [review, ...previous.items], total: result.data.total,
        average_rating: result.data.average_rating } : previous);
      setSaved(true);
      setComment("");
    } else {
      setError(result.error);
      // A duplicate can happen from another tab. Re-read eligibility before allowing another submission.
      if (result.status === 409) {
        const refreshed = await call<Reviews>(path);
        if (refreshed.ok) {
          if (!refreshed.data.can_review) {
            dialog.current?.close();
            setReviewOpen(false);
          }
          setData(refreshed.data);
        }
      }
    }
    setBusy(false);
  }

  async function more() {
    if (!data || loadingMore) return;
    setLoadingMore(true);
    const result = await call<Reviews>(`${path}?offset=${data.items.length}`);
    if (result.ok) setData((previous) => previous ? { ...result.data, items: [...previous.items, ...result.data.items] } : result.data);
    else setError(result.error);
    setLoadingMore(false);
  }

  return (
    <section aria-labelledby="product-reviews-title" className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id="product-reviews-title" className="min-w-0 font-heading text-lg sm:text-2xl">Customer reviews</h2>
        {data?.can_review && <Button variant="outline" className="h-auto min-h-10 max-w-[48%] shrink-0 px-3 py-2 text-xs sm:px-5 sm:text-sm" aria-haspopup="dialog" onClick={() => {
          dialog.current?.showModal();
          setReviewOpen(true);
        }}>Write customer review</Button>}
      </div>
      {error && !reviewOpen && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {!data && !error && <p role="status" className="mt-3 text-sm text-ink-soft">Loading reviews…</p>}
      {saved && <p role="status" className="mt-3 text-sm text-green-700">Thank you! Your review has been submitted.</p>}
      {data && <>
        <p className="mt-2 text-sm text-ink-soft">{data.total ? `${data.average_rating} / 5 · ${data.total} review${data.total === 1 ? "" : "s"}` : "No reviews yet."}</p>
        {data.can_review ? (
          <>
            <dialog ref={dialog} aria-labelledby="write-review-title" aria-describedby="write-review-description"
              onClose={() => setReviewOpen(false)} onCancel={(event) => { if (busy) event.preventDefault(); }}
              onClick={(event) => {
                if (busy || event.target !== event.currentTarget) return;
                const bounds = event.currentTarget.getBoundingClientRect();
                if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.current?.close();
              }}
              className="m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto rounded-2xl border border-line bg-white p-5 text-ink backdrop:bg-ink/40 sm:p-6">
              <form onSubmit={submit}>
                <div className="flex items-center justify-between gap-4">
                  <h3 id="write-review-title" className="font-heading text-xl">Write customer review</h3>
                  <button type="button" aria-label="Close review form" disabled={busy} onClick={() => dialog.current?.close()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-cream focus-visible:outline-2 focus-visible:outline-ink disabled:opacity-50"><X aria-hidden="true" size={20} /></button>
                </div>
                <p id="write-review-description" className="mt-1 text-sm text-ink-soft">You ordered this product. Share your experience.</p>
                {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
                <fieldset disabled={busy} className="mt-4">
                  <legend className="text-sm font-medium">Your rating</legend>
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => <label key={star} className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded focus-within:ring-2 focus-within:ring-ink">
                      <input type="radio" name="product-rating" value={star} checked={rating === star} onChange={() => setRating(star)} required
                        aria-label={`${star} star${star === 1 ? "" : "s"}`} className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" />
                      <Star aria-hidden="true" size={28} className={star <= rating ? "fill-amber-500 text-amber-500" : "text-ink-soft"} />
                    </label>)}
                  </div>
                  {rating > 0 && <p className="mt-1 text-xs text-ink-soft">{rating} out of 5 stars</p>}
                  <label htmlFor="product-review-comment" className="mt-4 block text-sm font-medium">Your review</label>
                  <textarea id="product-review-comment" required maxLength={2000} rows={4} value={comment} onChange={(e) => setComment(e.target.value)}
                    placeholder="How was the quality, fit and your experience?" className="mt-2 w-full rounded-xl border border-line p-3 text-sm" />
                  <p className="text-right text-xs text-ink-soft">{comment.length} / 2000</p>
                </fieldset>
                <Button type="submit" disabled={busy || rating === 0 || !comment.trim()} className="mt-4">{busy ? "Submitting…" : "Submit review"}</Button>
              </form>
            </dialog>
          </>
        ) : data.reason === "sign_in" ? (
          <p className="mt-4 text-sm"><Link className="underline" href={`/login?next=${encodeURIComponent(`/p/${slug}`)}`}>Sign in</Link> to review a product you have ordered.</p>
        ) : data.review ? <p className="mt-4 text-sm text-ink-soft">You have reviewed this product: {data.review.rating} / 5 stars.</p>
          : <p className="mt-4 text-sm text-ink-soft">Reviews are available after placing an order containing this product.</p>}
        <ul className="mt-6 grid gap-4">
          {data.items.map((review) => <li key={review.id} className="rounded-xl border border-line bg-white p-5">
            <div className="flex items-center justify-between gap-3"><p className="font-medium">{review.reviewer_name ?? "Customer"}</p>
              <span aria-label={`${review.rating} out of 5 stars`} className="text-amber-600">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span></div>
            <p className="mt-1 text-xs text-ink-soft">Verified order · {new Date(review.created_at).toLocaleDateString("en-IN")}</p>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{review.comment}</p>
          </li>)}
        </ul>
        {data.items.length < data.total && <Button variant="outline" disabled={loadingMore} onClick={more} className="mt-4">{loadingMore ? "Loading…" : "More reviews"}</Button>}
      </>}
    </section>
  );
}
