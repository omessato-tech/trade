
import { NextResponse } from 'next/server';

// It is not recommended to hardcode API keys in source code.
// A better practice is to use environment variables.
const API_KEY = 'f7010f51efmsh4986209e93b1d31p161596jsn50415a73229b';

const getFromDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 2); // Fetch data for the last 2 days for a solid history
    return date.toISOString().split('T')[0];
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const pairId = searchParams.get('pair');
    const category = searchParams.get('category');
    const latest = searchParams.get('latest');

    if (!pairId || !category) {
        return NextResponse.json({ error: 'Missing pair or category' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const from = getFromDate();
    
    // Polygon API uses different formats for Forex/CFD and Crypto
    const ticker = category === 'Forex' ? `C:${pairId.replace('/', '')}` : `X:${pairId.replace('/', '-')}`;
    
    let url = '';

    if (latest) {
        // Use different "last" endpoints for Forex and Crypto for reliability
        if (category === 'Forex') {
            url = `https://api.polygon.io/v1/last_quote/currencies/${pairId.split('/')[0]}/${pairId.split('/')[1]}?apiKey=${API_KEY}`;
        } else { // Crypto
            url = `https://api.polygon.io/v2/last/trade/${ticker}?apiKey=${API_KEY}`;
        }
    } else {
        // Fetch historical 1-minute candles
        url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/minute/${from}/${today}?adjusted=true&sort=asc&limit=5000&apiKey=${API_KEY}`;
    }

    try {
        const response = await fetch(url, { next: { revalidate: 0 } }); // Disable caching for this route
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Polygon API Error for URL ${url} (${response.status}): ${errorBody}`);
            return NextResponse.json({ error: 'Failed to fetch data from Polygon API' }, { status: response.status });
        }

        const data = await response.json();

        if (latest) {
             let price, timestamp;
             if (category === 'Forex') {
                if (!data.last) {
                    return NextResponse.json({ error: 'No latest forex quote data available' }, { status: 404 });
                }
                // Average the bid and ask for a representative price
                price = (data.last.ask + data.last.bid) / 2;
                timestamp = data.last.timestamp;
             } else { // Crypto
                if (!data.result) {
                    return NextResponse.json({ error: 'No latest crypto trade data available' }, { status: 404 });
                }
                price = data.result.p;
                timestamp = data.result.t;
             }
            
            // Format as a single-point candle for updating the chart
            const formattedData = { x: timestamp, o: price, h: price, l: price, c: price };
            return NextResponse.json(formattedData);

        } else { // Historical Data
             if (!data.results || data.results.length === 0) {
                return NextResponse.json({ error: 'No historical data available' }, { status: 404 });
            }
            // Format array of candles for the chart
            const formattedData = data.results.map((candle: any) => ({
                x: candle.t, o: candle.o, h: candle.h, l: candle.l, c: candle.c,
            }));
            return NextResponse.json(formattedData);
        }

    } catch (error) {
        console.error(`Error fetching from Polygon API for URL ${url}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
