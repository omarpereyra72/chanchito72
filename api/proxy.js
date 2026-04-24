// api/proxy.js — Vercel Serverless Function
// Reenvía el POST al Apps Script y devuelve la respuesta con headers CORS correctos

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwOpkPmZ9WM6hIRoBl5ZHRya3_Wlth_fMwN5K0sBc6b7z-SnLx7G_I9DBFj1NtfOUrH/exec';

export default async function handler(req, res) {
  // Permitir cualquier origen (el HTML en Vercel o local)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
      redirect: 'follow',
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: true, raw: text };
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
