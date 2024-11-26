import { Alchemy, Network } from 'alchemy-sdk';

// Cache the SOL price for 5 minutes
let cachedSolPrice: number | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Configure Alchemy SDK for future use
const config = {
  apiKey: process.env.VITE_ALCHEMY_API_KEY || 'demo',
  network: Network.SOL_MAINNET,
};

const alchemy = new Alchemy(config);

async function fetchCoinGeckoPrice(): Promise<number> {
    const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
        {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        }
    );
    
    if (!response.ok) {
        throw new Error(`CoinGecko HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data?.solana?.usd && typeof data.solana.usd === 'number') {
        return data.solana.usd;
    }
    throw new Error('Invalid price data from CoinGecko');
}

async function fetchBinancePrice(): Promise<number> {
    const response = await fetch(
        'https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT',
        {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
            }
        }
    );
    
    if (!response.ok) {
        throw new Error(`Binance HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data?.price && typeof data.price === 'string') {
        const price = parseFloat(data.price);
        if (price > 0) {
            return price;
        }
    }
    throw new Error('Invalid price data from Binance');
}

async function fetchKrakenPrice(): Promise<number> {
    const response = await fetch(
        'https://api.kraken.com/0/public/Ticker?pair=SOLUSD',
        {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        }
    );
    
    if (!response.ok) {
        throw new Error(`Kraken HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data?.result?.SOLUSD?.c?.[0]) {
        const price = parseFloat(data.result.SOLUSD.c[0]);
        if (price > 0) {
            return price;
        }
    }
    throw new Error('Invalid price data from Kraken');
}

export async function getSolPrice(): Promise<number> {
    const now = Date.now();
    if (cachedSolPrice && (now - lastFetchTime) < CACHE_DURATION) {
        return cachedSolPrice;
    }

    const apis = [
        { name: 'CoinGecko', fn: fetchCoinGeckoPrice },
        { name: 'Binance', fn: fetchBinancePrice },
        { name: 'Kraken', fn: fetchKrakenPrice }
    ];

    for (const api of apis) {
        try {
            const price = await api.fn();
            if (price > 0) {
                cachedSolPrice = price;
                lastFetchTime = now;
                return price;
            }
        } catch (error) {
            console.warn(`${api.name} API failed:`, error);
            continue;
        }
    }

    // If all APIs fail but we have a cached price, use it
    if (cachedSolPrice) {
        console.warn('All APIs failed. Using cached price as fallback');
        return cachedSolPrice;
    }

    // If everything fails and no cache, use a hardcoded fallback
    console.error('All price sources failed. Using hardcoded fallback price');
    return 60; // Hardcoded fallback price
}

export function getStartingPrice(): number {
    return 0.005; // $1 equivalent in SOL
}

export function getMinimumBid(currentPrice: number): number {
    return currentPrice + 0.005; // Current price + $1 equivalent
}

export function formatSol(amount: number | undefined | null): string {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return '0.0000';
    }
    return amount.toFixed(4);
}

export function formatUsd(amount: number | undefined | null, solPrice: number | undefined | null): string {
    if (typeof amount !== 'number' || typeof solPrice !== 'number' || isNaN(amount) || isNaN(solPrice)) {
        return '0.00';
    }
    return (amount * solPrice).toFixed(2);
}
