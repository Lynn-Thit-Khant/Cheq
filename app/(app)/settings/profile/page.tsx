"use client"

import { useEffect, useState } from "react"
import { BackButton } from "@/components/back-button"
import { useUser } from "@/components/user-provider"
import { Pencil, Copy } from "lucide-react"
import {
  MorphPopover,
  MorphPopoverContent,
  MorphPopoverTrigger,
} from "@/components/motion/popover-morph"
import { Button } from "@/components/motion/button/base"
import { ActionSwapBlurButton, type ActionSwapItem } from "@/components/motion/action-swap-blur"
import { Check } from "lucide-react"
export default function ProfilePage() {
  const { user } = useUser()
  const userEmail = user?.email || ""
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || ""
  const [nameOpen, setNameOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [copyState, setCopyState] = useState<string>("copy")

  const COPY_ITEMS: ActionSwapItem[] = [
    {
      id: "copy",
      label: "Copy Email",
      icon: <Copy className="h-4 w-4" strokeWidth={1.5} />,
    },
    {
      id: "copied",
      label: "Copied!",
      icon: <Check className="h-4 w-4" strokeWidth={1.5} />,
    },
  ]

  return (
    <>
    {/* Full screen backdrop for Telegram effect */}
    <div 
      className={`fixed inset-0 z-[55] bg-black/60 backdrop-blur-lg transition-opacity duration-300 ${nameOpen || emailOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
      onClick={() => { setNameOpen(false); setEmailOpen(false); }}
    />

    <div className="flex flex-1 flex-col p-4 w-full max-w-md mx-auto mt-2 h-full">
      <div className="grid grid-cols-[3rem_1fr_3rem] items-center w-full mb-2 shrink-0">
        <BackButton href="/settings" />
        <h1 className="text-2xl font-bold text-center">Profile</h1>
        <div />
      </div>

      <div className="flex-1 flex flex-col justify-start w-full mt-6">

      <div className="flex flex-col gap-4 w-full relative">
        <div className="absolute inset-0 bg-card/80 backdrop-blur-xl rounded-[28px] border border-border/40 pointer-events-none" />
        <div className="flex flex-col p-1">
            <MorphPopover open={nameOpen} onOpenChange={setNameOpen}>
              <MorphPopoverTrigger>
                <button type="button" className={`flex w-full items-center justify-between px-6 py-3 gap-3 group relative transition-[transform,box-shadow] duration-300 cursor-pointer rounded-[24px] outline-none ${nameOpen ? 'z-[60] bg-card shadow-2xl scale-[1.02] ring-1 ring-border/50' : 'z-10 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10'}`}>
                  <span className="text-[15px] leading-6 text-muted-foreground shrink-0">Name</span>
                  <span className="text-[15px] font-medium text-foreground text-right">{userName}</span>
                </button>
              </MorphPopoverTrigger>
              <MorphPopoverContent align="end" sideOffset={0} radius={30} unstyled className="w-auto p-4 -mr-4 -mt-2">
                <div className="rounded-full bg-card/90 backdrop-blur-xl border border-border/50 overflow-hidden">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => setNameOpen(false)}
                    className="w-full justify-start font-medium text-foreground"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={1.5} />
                    Edit Name
                  </Button>
                </div>
              </MorphPopoverContent>
            </MorphPopover>

            <MorphPopover open={emailOpen} onOpenChange={setEmailOpen}>
              <MorphPopoverTrigger>
                <button type="button" className={`flex w-full items-center justify-between px-6 py-3 gap-3 group relative transition-[transform,box-shadow] duration-300 cursor-pointer rounded-[24px] outline-none ${emailOpen ? 'z-[60] bg-card shadow-2xl scale-[1.02] ring-1 ring-border/50' : 'z-10 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10'}`}>
                  <span className="text-[15px] leading-6 text-muted-foreground shrink-0">Email</span>
                  <span className="text-[15px] font-medium text-foreground text-right break-all">{userEmail}</span>
                </button>
              </MorphPopoverTrigger>
              <MorphPopoverContent align="end" sideOffset={0} radius={30} unstyled className="w-auto p-4 -mr-4 -mt-2 flex flex-col gap-2">
                <div className="rounded-full bg-card/90 backdrop-blur-xl border border-border/50 overflow-hidden">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => setEmailOpen(false)}
                    className="w-full justify-start font-medium text-foreground"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={1.5} />
                    Edit Email
                  </Button>
                </div>
                <div className="rounded-full bg-card/90 backdrop-blur-xl border border-border/50 overflow-hidden">
                  <ActionSwapBlurButton
                    items={COPY_ITEMS}
                    value={copyState}
                    variant="ghost"
                    size="md"
                    cycle={false}
                    onClick={() => {
                      if (copyState === "copied") return;
                      navigator.clipboard.writeText(userEmail)
                      setCopyState("copied")
                      setTimeout(() => {
                        setCopyState("copy")
                      }, 2000)
                    }}
                    className="w-full justify-start font-medium text-foreground"
                  />
                </div>
              </MorphPopoverContent>
            </MorphPopover>
        </div>
      </div>
      </div>
    </div>
    </>
  )
}
