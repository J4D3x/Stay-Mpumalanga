'use client';
import { FormEvent,useState } from 'react'; import { createClient } from '@/lib/supabase/client'; import Link from 'next/link';
export default function Register(){
    const [email,setEmail]=useState('');
    const [password,setPassword]=useState('');
    const [msg,setMsg]=useState('');
    const [error,setError]=useState('');
    async function submit(e:FormEvent){e.preventDefault();
        setError('');
        setMsg('');
        const {error}=await createClient().auth.signUp({email,password});
        if(error)setError(error.message);
        else setMsg('Account created. Check your email if confirmation is enabled.');}
        return <main className="auth">
            <form onSubmit={submit} className="authCard">
                <span className="eyebrow">GET STARTED</span>
                <h1>Create account</h1>
                <label>Email
                    <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/>
                    </label>
                    <label>Password
                        <input type="password" minLength={6} required value={password} onChange={e=>setPassword(e.target.value)}/>
                        </label>
                        {error&&<div className="error">{error}
                            </div>}
                            {msg&&<div className="success">{msg}
                                </div>}
                                <button className="button">Create account</button>
                                <p>Already registered? <Link href="/login">Sign in</Link></p>
                                </form>
                                </main>}
