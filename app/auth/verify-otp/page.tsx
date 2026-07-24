import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { VerifyOTPForm } from './verify-otp-form'

export default async function VerifyOTPPage() {
  const cookieStore = await cookies()
  const email = cookieStore.get('auth_email')?.value
  const type = cookieStore.get('auth_type')?.value as 'signup' | 'recovery' | undefined

  if (!email || !type) {
    redirect('/auth/login')
  }

  return <VerifyOTPForm email={email} type={type} />
}
