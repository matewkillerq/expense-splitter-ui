import { getCurrencySymbol, type CurrencyCode } from "@/lib/utils/currency"

interface FormattedAmountProps {
    amount: number
    currency?: CurrencyCode
    className?: string
    symbolClassName?: string
    centsClassName?: string
}

export function FormattedAmount({
    amount,
    currency = 'USD',
    className = '',
    symbolClassName = '',
    centsClassName = ''
}: FormattedAmountProps) {
    const symbol = getCurrencySymbol(currency)
    const integerPart = Math.floor(Math.abs(amount))
    const centsPart = (Math.abs(amount) % 1).toFixed(2).slice(2)
    const isNegative = amount < 0

    // Format integer with thousands separator (dot)
    const formattedInteger = integerPart.toLocaleString('en-US', { useGrouping: true }).replace(/,/g, '.')

    return (
        <span className={className}>
            {isNegative && '-'}
            <span className={symbolClassName}>{symbol}</span>
            <span>{formattedInteger}</span>
            <span className={centsClassName}>{centsPart}</span>
        </span>
    )
}
