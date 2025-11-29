export type BankCode = 'REVOLUT' | 'SANTANDER' | 'BBVA' | 'CAIXABANK' | 'MERCADOPAGO'

export interface Bank {
    code: BankCode
    name: string
    appLink: string
    icon: string
}

export const BANKS: Record<BankCode, Bank> = {
    REVOLUT: {
        code: 'REVOLUT',
        name: 'Revolut',
        appLink: 'https://www.revolut.com//app',
        icon: '/icon apps/Revolut.webp'
    },
    SANTANDER: {
        code: 'SANTANDER',
        name: 'Santander',
        appLink: 'https://www.bancosantander.es//app',
        icon: '/icon apps/Santander.webp'
    },
    BBVA: {
        code: 'BBVA',
        name: 'BBVA',
        appLink: 'https://www.bbva.es//app',
        icon: '/icon apps/BBVA.webp'
    },
    CAIXABANK: {
        code: 'CAIXABANK',
        name: 'CaixaBank',
        appLink: 'https://www.caixabank.es//app',
        icon: '/icon apps/Caixa.webp'
    },
    MERCADOPAGO: {
        code: 'MERCADOPAGO',
        name: 'Mercado Pago',
        appLink: 'https://www.mercadopago.com//app',
        icon: '/icon apps/MercadoPago.webp'
    }
}

export function getBankByCode(code: BankCode | null | undefined): Bank | null {
    if (!code) return null
    return BANKS[code] || null
}

export function getBankAppLink(code: BankCode | null | undefined): string | null {
    const bank = getBankByCode(code)
    return bank?.appLink || null
}
