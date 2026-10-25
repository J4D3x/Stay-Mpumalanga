import Link from 'next/link';
import { Listing } from '@/types';

export function ListingCard({ l }: { l: Listing }) {
  return (
    <article className="card">
      <img src={l.imageUrl} alt={l.name} />

      <div className="cardBody">
        <div className="badges">
          {l.nsfas && (
            <span className="badge green">NSFAS</span>
          )}

          {l.distanceKm !== null && (
            <span className="badge">
              {l.distanceKm} km away
            </span>
          )}
        </div>

        <h3>{l.name}</h3>
        <p>{l.location} · {l.institution}</p>

        <div className="cardBottom">
          <strong>
            R{l.price.toLocaleString()}
            <small>/month</small>
          </strong>

          <Link href={`/listing/${l.id}`}>View</Link>
        </div>
      </div>
    </article>
  );
}