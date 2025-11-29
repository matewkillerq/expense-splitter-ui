"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { getCurrencySymbol, type CurrencyCode } from "@/lib/utils/currency"

interface AnimatedNumberProps {
  value: number
  className?: string
  currency?: CurrencyCode
  duration?: number
}

export function AnimatedNumber({ value, className = "", currency = 'USD', duration = 800 }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const previousValue = useRef(value)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const startValue = previousValue.current
    const endValue = value
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Smooth easing function - ease out cubic
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)

      const current = startValue + (endValue - startValue) * easeOutCubic
      setDisplayValue(current)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        previousValue.current = endValue
      }
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [value, duration])

  const isNegative = displayValue < 0
  const absValue = Math.abs(displayValue)
  const symbol = getCurrencySymbol(currency)
  const integerPart = Math.floor(absValue)
  const centsPart = (absValue % 1).toFixed(2).slice(2)

  // Format integer with thousands separator (dot)
  const formattedInteger = integerPart.toLocaleString('en-US', { useGrouping: true }).replace(/,/g, '.')

  return (
    <motion.div
      className={`flex items-center justify-center tabular-nums ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <span className={isNegative ? "text-destructive" : ""}>
        {isNegative && "-"}
        <span className="text-5xl">{symbol}</span>
        <span className="text-5xl">{formattedInteger}</span>
        <span className="align-super text-2xl ml-0.5">{centsPart}</span>
      </span>
    </motion.div>
  )
}
