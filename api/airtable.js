// /api/airtable  —  Proxy serverless per Airtable (Vercel Node runtime)
//
// Il token Airtable vive SOLO qui, come variabile d'ambiente lato server,
// e non viene mai inviato al browser. Il client chiama /api/airtable,
// questa funzione aggiunge l'Authorization header e inoltra ad Airtable.
//
// Variabili d'ambiente richieste (impostarle nel pannello Vercel):
//   AIRTABLE_TOKEN  -> il Personal Access Token (NUOVO, dopo aver revocato il vecchio)
//   AIRTABLE_BASE   -> es. applU9DoBPdCfYT5V
//   AIRTABLE_TABLE  -> es. tbli2kxLMhRQlHndE

export default async function handler(req, res) {
  const TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE  = process.env.AIRTABLE_BASE;
  const TABLE = process.env.AIRTABLE_TABLE;

  if (!TOKEN || !BASE || !TABLE) {
    return res.status(500).json({ error: { message: "Backend non configurato (env mancanti)" } });
  }

  const method = req.method;
  // Solo i metodi realmente usati dall'app
  if (!["GET", "POST", "PATCH"].includes(method)) {
    return res.status(405).json({ error: { message: "Metodo non permesso" } });
  }

  // Il client passa il path Airtable (es. "?filterByFormula=..." oppure "/recId")
  // come singolo parametro ?path=... già url-encoded.
  const path = typeof req.query.path === "string" ? req.query.path : "";
  const url = "https://api.airtable.com/v0/" + BASE + "/" + TABLE + path;

  const opts = {
    method: method,
    headers: {
      "Authorization": "Bearer " + TOKEN,
      "Content-Type": "application/json"
    }
  };
  if (method === "POST" || method === "PATCH") {
    // req.body è già parsato da Vercel quando il content-type è JSON
    opts.body = JSON.stringify(req.body || {});
  }

  try {
    const r = await fetch(url, opts);
    const text = await r.text();
    res.status(r.status);
    res.setHeader("Content-Type", "application/json");
    return res.send(text);
  } catch (e) {
    return res.status(502).json({ error: { message: "Errore upstream: " + e.message } });
  }
}
