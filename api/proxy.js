// api/proxy.js — Vercel Serverless Function v3
// Fix: Google Apps Script redirige (302) antes de devolver JSON.
// node-fetch sigue redirecciones pero pierde el body en algunos casos.
// Solución: seguir manualmente hasta obtener respuesta con body JSON.

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwOpkPmZ9WM6hIRoBl5ZHRya3_Wlth_fMwN5K0sBc6b7z-SnLx7G_I9DBFj1NtfOUrH/exec';

async function fetchWithRedirect(url, options = {}, maxRedirects = 5) {
  let currentUrl = url;
  for (let i = 0; i < maxRedirects; i++) {
    const res = await fetch(currentUrl, { ...options, redirect: 'manual' });
    // Si es redirección, seguirla manualmente
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) break;
      currentUrl = location;
      // En redirecciones GET, limpiar body y cambiar método
      options = { ...options, method: 'GET', body: undefined, headers: { 'Content-Type': 'application/json' } };
      continue;
    }
    return res;
  }
  throw new Error('Demasiadas redirecciones');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const qs = new URLSearchParams(req.query).toString();
      const url = qs ? `${APPS_SCRIPT_URL}?${qs}` : APPS_SCRIPT_URL;

      const response = await fetchWithRedirect(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const text = await response.text();
      try {
        return res.status(200).json(JSON.parse(text));
      } catch {
        // Si no es JSON, loguear los primeros chars para debug
        return res.status(200).json({
          ok: false,
          error: 'Respuesta no JSON del Apps Script',
          preview: text.slice(0, 300),
        });
      }
    }

    if (req.method === 'POST') {
      const body = JSON.stringify(req.body);
      const response = await fetchWithRedirect(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
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
