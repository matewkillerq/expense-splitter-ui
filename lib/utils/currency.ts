export const CURRENCIES = {
    USD: { symbol: '$', name: 'Dólar', code: 'USD' },
    EUR: { symbol: '€', name: 'Euro', code: 'EUR' },
    ARS: { symbol: '$', name: 'Peso Argentino', code: 'ARS' }
} as const

export type CurrencyCode = keyof typeof CURRENCIES

export function getCurrencySymbol(currency: CurrencyCode): string {
    return CURRENCIES[currency]?.symbol || '$'
}

export function formatCurrency(amount: number, currency: CurrencyCode = 'USD'): string {
    const symbol = getCurrencySymbol(currency)
    return `${symbol}${amount.toFixed(2)}`
}

export function getCurrencyName(currency: CurrencyCode): string {
    return CURRENCIES[currency]?.name || 'Dólar'
}
