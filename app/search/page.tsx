'use client';
import { useMemo,useState } from 'react'; 
import { ListingCard } from '@/components/ListingCard'; 
import dynamic from "next/dynamic";
import { mockListings } from '@/lib/data';
export default function SearchPage(){const [q,setQ]=useState('');
    const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
});
    const [nsfas,setNsfas]=useState(false);
    const [max,setMax]=useState(5000);
    const filtered= useMemo(()=>mockListings.filter(l=>(!q||`${l.name} ${l.location} ${l.institution}`.toLowerCase().includes(q.toLowerCase()))&&l.price<=max&&(!nsfas||l.nsfas)),[q,max,nsfas]);
    return <main className="section searchPage">
        <div className="sectionHead">
            <div>
            <span className="eyebrow">DISCOVER</span>
            <h1>Find accommodation</h1>
            <p>{filtered.length} accommodation options</p>
            </div>
            </div>
            <div className="searchLayout">
                <aside className="filters">
                    <label>Search
                        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="eMalahleni, UMP..."/>
                    </label>
                    <label>Maximum monthly price
                        <input type="range" min="1500" max="6000" step="100" value={max} onChange={e=>setMax(+e.target.value)}/>
                        <strong>R{max.toLocaleString()}</strong>
                        </label>
                        <label className="check">
                            <input type="checkbox" checked={nsfas} onChange={e=>setNsfas(e.target.checked)}/> 
                            NSFAS accredited / information available</label>
                            </aside>
                            <div className="results">
                                <div className="grid">{filtered.map(l=><ListingCard key={l.id} l={l}/>)}
                                </div>
                                </div>
                                </div><Map listings={filtered}  />
                                </main>}
