import Link from "next/link";
export default function NotFound() {
  return (
    <main className="not-found">
      <h1>Payment not found</h1>
      <p>This payment isn’t in the current dataset.</p>
      <Link className="button primary" href="/payments">
        Back to payments
      </Link>
    </main>
  );
}
