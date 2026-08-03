import { Loader } from "@/components/motion/loader"

export default function AppLoading() {
  return (
    <div className="flex-1 flex items-center justify-center py-16">
      <Loader variant="ascii-braille" size={28} className="text-muted-foreground" />
    </div>
  )
}
