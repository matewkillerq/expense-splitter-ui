"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Loader2 } from "lucide-react"
import { authService } from "@/lib/services/auth.service"

export default function SignUpPage() {
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!username.trim() || !displayName.trim() || !password) {
        throw new Error("Todos los campos son requeridos")
      }

      const { user, error: signUpError } = await authService.signUp({
        username: username.trim(),
        displayName: displayName.trim(),
        password,
      })

      if (signUpError) throw new Error(signUpError)
      if (!user) throw new Error("Error al crear la cuenta")

      // Redirigir al dashboard
      router.push("/")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link href="/auth/login">
          <Button variant="ghost" className="mb-8 -ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio de sesión
          </Button>
        </Link>

        <div className="space-y-2 mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Crear cuenta</h1>
          <p className="text-muted-foreground">Comienza a dividir gastos con tus amigos</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="text-sm font-medium text-muted-foreground mb-2 block">
                Nombre de usuario
              </label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-14 text-lg rounded-xl border-border/50 bg-muted/30"
                required
              />
            </div>

            <div>
              <label htmlFor="displayName" className="text-sm font-medium text-muted-foreground mb-2 block">
                Nombre para mostrar
              </label>
              <Input
                id="displayName"
                type="text"
                placeholder="John Doe"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-14 text-lg rounded-xl border-border/50 bg-muted/30"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-muted-foreground mb-2 block">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 text-lg rounded-xl border-border/50 bg-muted/30"
                required
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-destructive/10 border border-destructive/20"
            >
              <p className="text-sm text-destructive">{error}</p>
            </motion.div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 text-lg font-semibold rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-all"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Crear cuenta"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/auth/login" className="text-foreground font-medium hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
