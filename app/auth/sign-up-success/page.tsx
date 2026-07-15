import { GalleryVerticalEnd } from "lucide-react"
import Link from 'next/link'
import { FieldGroup, FieldDescription } from "@/components/ui/field"

export default function SignUpSuccessPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="flex flex-col gap-6">
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Link href="/" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
            </Link>
            <h1 className="text-xl font-bold">Registration Successful</h1>
            <FieldDescription>Check your email to verify your account.</FieldDescription>
          </div>
          <p className="text-sm text-center text-muted-foreground mt-4">
            We&apos;ve sent a verification link to your email address. Please click the link to activate your account.
          </p>
        </FieldGroup>
      </div>
    </div>
  )
}
