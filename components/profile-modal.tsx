"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Camera, LogOut, Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserAvatar } from "@/components/user-avatar"

import { useRouter } from "next/navigation"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: {
    id: string
    display_name: string
    avatar_url: string | null
  }
  onUpdateProfile: (name: string, avatarUrl: string | null) => void
}

const emojiOptions = ["🐶", "🐱", "🦊", "🐻", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🦟", "🦗", "🕷", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🐘", "🦛", "🦏", "🐪", "🐫", "🦒", "🦘", "🐃", "🐂", "🐄", "🐎", "🐖", "🐏", "🐑", "🦙", "🐐", "🦌", "🐕", "🐩", "🦮", "🐕‍🦺", "🐈", "🐈‍⬛", "🐓", "🦃", "🦚", "🦜", "🦢", "🦩", "🕊", "🐇", "🦝", "🦨", "🦡", "🦦", "🦥", "🐁", "🐀", "🐿", "🦔", "🐾", "🐉", "🐲"]

export function ProfileModal({ isOpen, onClose, profile, onUpdateProfile }: ProfileModalProps) {
  const [name, setName] = useState(profile.display_name)
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatar_url || emojiOptions[0])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleOpen = () => {
    setName(profile.display_name)
    setSelectedAvatar(profile.avatar_url || emojiOptions[0])
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setIsLoading(true)

    // Simulate update
    setTimeout(() => {
      onUpdateProfile(name.trim(), selectedAvatar)
      onClose()
      setIsLoading(false)
    }, 1000)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    // Simulate logout
    setTimeout(() => {
      router.push("/auth/login")
    }, 500)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Archivo demasiado grande. Por favor elige una imagen menor a 5MB.")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedAvatar(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
            onAnimationComplete={handleOpen}
          />
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:right-auto md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-card rounded-t-3xl md:rounded-3xl z-50 max-h-[85vh] overflow-y-auto shadow-2xl"
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Perfil</h2>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </motion.button>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <UserAvatar
                    name={name}
                    avatarUrl={selectedAvatar}
                    className="h-24 w-24 border-4 border-background shadow-lg"
                    fallbackClassName="text-3xl"
                  />
                  <div className="absolute -bottom-1 -right-1 p-2 rounded-full bg-foreground text-background group-hover:scale-110 transition-transform">
                    <Camera className="h-4 w-4" />
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-muted-foreground">Toca para subir foto</p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">O elige un emoji</label>
                <div className="grid grid-cols-6 gap-2 max-h-[150px] overflow-y-auto p-1">
                  {emojiOptions.map((emoji) => (
                    <motion.button
                      key={emoji}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedAvatar(emoji)}
                      className={`aspect-square flex items-center justify-center text-2xl rounded-xl transition-all ${selectedAvatar === emoji
                        ? "bg-primary/20 ring-2 ring-primary"
                        : "bg-muted/30 hover:bg-muted"
                        }`}
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">Nombre para mostrar</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="h-14 text-lg rounded-xl border-border/50 bg-muted/30"
                />
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleSave}
                  disabled={isLoading || !name.trim()}
                  className="w-full h-14 text-base font-semibold rounded-xl bg-foreground text-background hover:bg-foreground/90"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Guardar cambios"}
                </Button>

                <Button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  variant="outline"
                  className="w-full h-14 text-base font-semibold rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 bg-transparent"
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <LogOut className="h-5 w-5 mr-2" />
                      Cerrar sesión
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
