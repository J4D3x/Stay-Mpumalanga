'use client';
import Link from 'next/link';
import { useEffect,useState } from 'react';
import { createClient } from '@/lib/supabase/client';
export function Nav(){const [email,setEmail]=useState<string|null>(null); useEffect(()=>{const s=createClient();s.auth.getUser().then(({data})=>setEmail(data.user?.email??null));},[]); return <header className="nav"><Link href="/" className="brand">Stay<span>Mpumalanga</span></Link><nav><Link href="/search">Find accommodation</Link><Link href="/provider">List your property</Link>{email?<Link href="/dashboard">Dashboard</Link>:<Link href="/login" className="navButton">Sign in</Link>}</nav></header>}
