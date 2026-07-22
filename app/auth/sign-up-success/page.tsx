import { GalleryVerticalEnd } from "lucide-react"
import Link from 'next/link'
import { FieldGroup, FieldDescription } from "@/components/ui/field"

export default function SignUpSuccessPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="flex flex-col gap-6">
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold">Registration Successful</h1>
            <FieldDescription className="text-center">
              Check your email to verify your account.
            </FieldDescription>
          </div>

        </FieldGroup>
      </div>
    </div>
  )
}
