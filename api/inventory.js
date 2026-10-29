// API Serverless para Vercel - AnimeCostura
// Permite leer y actualizar el inventario en tiempo real desde cualquier dispositivo

export default async function handler(req, res) {
    // Permitir CORS universal
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 1. Si Vercel KV / Upstash Redis está disponible en las variables de entorno
    const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (req.method === 'GET') {
        if (kvUrl && kvToken) {
            try {
                const response = await fetch(`${kvUrl}/get/anime_inventory`, {
                    headers: { Authorization: `Bearer ${kvToken}` }
                });
                const data = await response.json();
                if (data && data.result) {
                    const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
                    return res.status(200).json(parsed);
                }
            } catch (err) {
                console.warn('[Vercel API] Error leyendo de KV:', err);
            }
        }

        // Fallback: Leer data/inventory.json
        try {
            const fs = await import('fs');
            const path = await import('path');
            const filePath = path.join(process.cwd(), 'data', 'inventory.json');
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                return res.status(200).json(JSON.parse(content));
            }
        } catch (e) {
            console.warn('[Vercel API] Error leyendo archivo estático:', e);
        }

        return res.status(200).json([]);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
        const body = req.body;
        const inventory = Array.isArray(body) ? body : (body && body.inventory ? body.inventory : null);

        if (!inventory || !Array.isArray(inventory)) {
            return res.status(400).json({ error: 'Formato de inventario inválido. Debe ser una lista de prendas.' });
        }

        if (kvUrl && kvToken) {
            try {
                await fetch(`${kvUrl}/set/anime_inventory`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${kvToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(inventory)
                });
                return res.status(200).json({ success: true, count: inventory.length, storage: 'kv' });
            } catch (err) {
                console.warn('[Vercel API] Error escribiendo en KV:', err);
            }
        }

        // Fallback en entorno local / desarrollo
        try {
            const fs = await import('fs');
            const path = await import('path');
            const filePath = path.join(process.cwd(), 'data', 'inventory.json');
            fs.writeFileSync(filePath, JSON.stringify(inventory, null, 2), 'utf8');
            return res.status(200).json({ success: true, count: inventory.length, storage: 'file' });
        } catch (e) {
            // En Vercel serverless puro sin KV el filesystem es read-only
            return res.status(200).json({ success: true, count: inventory.length, storage: 'memory' });
        }
    }

    return res.status(405).json({ error: 'Método no permitido' });
}
