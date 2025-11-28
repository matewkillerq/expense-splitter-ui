"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/services/auth.service"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { user, error: loginError } = await authService.signIn(username.trim(), password)

      if (loginError) throw new Error(loginError)
      if (!user) throw new Error("Error al iniciar sesión")

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
        <div className="space-y-2 mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Bienvenido de nuevo</h1>
          <p className="text-muted-foreground">Inicia sesión en tu cuenta para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
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
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Iniciar sesión"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          ¿No tienes cuenta?{" "}
          <Link href="/auth/signup" className="text-foreground font-medium hover:underline">
            Regístrate
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
