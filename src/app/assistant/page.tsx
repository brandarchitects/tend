"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useChatStore } from "@/store/chat"

// The assistant is now a global panel, not a separate page.
// This redirect opens the panel and goes to dashboard.
export default function AssistantRedirect() {
  const router = useRouter()
  const { setOpen } = useChatStore()

  useEffect(() => {
    setOpen(true)
    router.replace("/")
  }, [setOpen, router])

  return null
}
