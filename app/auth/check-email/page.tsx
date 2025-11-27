"use client"

import { motion } from "framer-motion"
import { Mail } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8 text-center"
      >
        <div className="mx-auto w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
          <Mail className="h-8 w-8 text-accent" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
          <p className="text-muted-foreground">
            We sent you a confirmation link. Please check your inbox and click the link to verify your account.
          </p>
        </div>

        <Button asChild variant="outline" className="w-full h-14 rounded-2xl bg-transparent">
          <Link href="/auth/login">Back to login</Link>
        </Button>
      </motion.div>
    </div>
  )
}
