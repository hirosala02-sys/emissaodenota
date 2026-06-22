import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
    // Add CORS headers for serverless environment
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (request.method === 'OPTIONS') {
        response.status(200).end();
        return;
    }

    try {
        // Create table if it doesn't exist
        await sql`
            CREATE TABLE IF NOT EXISTS providers (
                cnpj VARCHAR(20) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                im VARCHAR(50),
                regime VARCHAR(50) NOT NULL,
                serviceCode VARCHAR(50),
                uf VARCHAR(2),
                city VARCHAR(100),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;

        if (request.method === 'GET') {
            const { rows } = await sql`SELECT * FROM providers ORDER BY name ASC;`;
            return response.status(200).json(rows);
        }

        if (request.method === 'POST') {
            const { cnpj, name, im, regime, serviceCode, uf, city } = request.body;
            if (!cnpj || !name) {
                return response.status(400).json({ error: 'CNPJ and Name are required' });
            }

            // Insert or Update (Upsert) query
            await sql`
                INSERT INTO providers (cnpj, name, im, regime, serviceCode, uf, city)
                VALUES (${cnpj}, ${name}, ${im}, ${regime}, ${serviceCode}, ${uf}, ${city})
                ON CONFLICT (cnpj)
                DO UPDATE SET 
                    name = ${name}, 
                    im = ${im}, 
                    regime = ${regime}, 
                    serviceCode = ${serviceCode}, 
                    uf = ${uf}, 
                    city = ${city};
            `;
            return response.status(200).json({ success: true });
        }

        if (request.method === 'DELETE') {
            const { cnpj } = request.query;
            if (!cnpj) {
                return response.status(400).json({ error: 'CNPJ is required' });
            }
            await sql`DELETE FROM providers WHERE cnpj = ${cnpj};`;
            return response.status(200).json({ success: true });
        }

        return response.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: error.message });
    }
}
