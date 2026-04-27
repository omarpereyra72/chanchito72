// api/proxy.js — Vercel Serverless Function v2
// Maneja GET (getCategorias, getSaldos, getDashboard) y POST (movimiento, actualizarSaldo)

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwOpkPmZ9WM6hIRoBl5ZHRya3_Wlth_fMwN5K0sBc6b7z-SnLx7G_I9DBFj1NtfOUrH/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const params = new URLSearchParams(req.query).toString();
      const url = params ? `${APPS_SCRIPT_URL}?${params}` : APPS_SCRIPT_URL;
      const response = await fetch(url, { method: 'GET', redirect: 'follow' });
      const text = await response.text();
      try {
        return res.status(200).json(JSON.parse(text));
      } catch {
        return res.status(200).json({ ok: false, error: 'Respuesta no JSON', raw: text.slice(0, 200) });
      }
    }

    if (req.method === 'POST') {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
        redirect: 'follow',
      });
      const text = await response.text();
      try {
        return res.status(200).json(JSON.parse(text));
      } catch {
        return res.status(200).json({ ok: true, raw: text.slice(0, 200) });
      }
    }

    return res.status(405).json({ ok: false, error: 'Método no permitido' });

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
