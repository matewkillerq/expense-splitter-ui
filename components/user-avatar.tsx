"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
    name: string
    avatarUrl?: string | null
    className?: string
    fallbackClassName?: string
}

export function UserAvatar({ name, avatarUrl, className, fallbackClassName }: UserAvatarProps) {
    // Simple heuristic: if it starts with http or data:, it's a URL. Otherwise treat as emoji/text.
    const isUrl = avatarUrl && (avatarUrl.startsWith("http") || avatarUrl.startsWith("data:"))

    return (
        <Avatar className={className}>
            {isUrl ? (
                <AvatarImage src={avatarUrl} alt={name} />
            ) : null}

            <AvatarFallback className={cn("font-medium", fallbackClassName)}>
                {/* If avatarUrl is present but not a URL, assume it's an emoji and show it. 
            Otherwise show initials. */}
                {avatarUrl && !isUrl ? (
                    <span className="text-lg leading-none">{avatarUrl}</span>
                ) : (
                    (name || "").slice(0, 2).toUpperCase()
                )}
            </AvatarFallback>
        </Avatar>
    )
}
