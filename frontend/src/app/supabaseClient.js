// frontend/src/app/page.js
'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [q, setQ] = useState(''), [res, setRes] = useState([]);
  const search = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('singles')
      .select('id, first_name, last_name, city, state, images')
      .ilike('first_name', `%${q}%`)
      .or(`last_name.ilike.%${q}%`)
      .limit(50);
    if (error) return alert(error.message);
    setRes(data);
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Search Singles</h1>
      <form onSubmit={search}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="First or last name"
          style={{ padding: '0.5rem', width: '70%' }}
        />
        <button type="submit" style={{ padding: '0.5rem', marginLeft: '0.5rem' }}>
          Search
        </button>
      </form>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
        {res.map((r) => (
          <li key={r.id} style={{ borderBottom: '1px solid #ccc', padding: '0.5rem 0' }}>
            <strong>{r.first_name} {r.last_name}</strong><br/>
            {r.city}, {r.state}<br/>
            {r.images?.[0] && <img src={r.images[0]} alt="" style={{ maxWidth: 100, marginTop: 4 }} />}
          </li>
        ))}
      </ul>
    </main>
  );
}
