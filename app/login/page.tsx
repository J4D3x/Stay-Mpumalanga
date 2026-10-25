'use client';
import { FormEvent,useState } from 'react'; import { createClient } from '@/lib/supabase/client'; import Link from 'next/link'; import { useRouter } from 'next/navigation';
export default function Login(){const
     [email,setEmail]=useState('');
     const [password,setPassword]=useState('');
     const [error,setError]=useState('');
     const [loading,setLoading]=useState(false);
     const router=useRouter();
     async function submit(e:FormEvent){e.preventDefault();setLoading(true);
        setError('');const {error}=await createClient().auth.signInWithPassword({email,password});
        if(error)setError(error.message);
        else router.push('/dashboard');
        setLoading(false)}return 
        <main className="auth">
            <form onSubmit={submit} className="authCard">
                <span className="eyebrow">WELCOME BACK</span>
                <h1>Sign in</h1>
                <p>Access your saved listings and applications.</p>
                <label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
                <label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
                {error&&<div className="error">{error}</div>}<button className="button" disabled={loading}>{loading?'Signing in...':'Sign in'}</button><p>New here? <Link href="/register">Create an account</Link></p></form></main>}
