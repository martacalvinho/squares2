// Cache the SOL price for 5 minutes
let cachedSolPrice: number | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function getSolPrice(): Promise<number> {
    const now = Date.now();
    if (cachedSolPrice && (now - lastFetchTime) < CACHE_DURATION) {
        return cachedSolPrice;
    }

    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await response.json();
        cachedSolPrice = data.solana.usd;
        lastFetchTime = now;
        return cachedSolPrice;
    } catch (error) {
        console.error('Error fetching SOL price:', error);
        return cachedSolPrice || 100; // Fallback price if fetch fails
    }
}

export function getStartingPrice(): number {
    return 0.005; // $1 equivalent in SOL
}

export function getMinimumBid(currentPrice: number): number {
    return currentPrice + 0.005; // Current price + $1 equivalent
}

export function formatSol(amount: number): string {
    return amount.toFixed(4);
}

export function formatUsd(amount: number, solPrice: number): string {
    return (amount * solPrice).toFixed(2);
}
