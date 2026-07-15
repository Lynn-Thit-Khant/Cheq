import { createClient } from '@/lib/server'


export default async function Page() {
  const supabase = await createClient()
  const { data: todos } = await supabase.from('todos').select()

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-zinc-50 font-sans dark:bg-black relative">

      <ul className="text-black dark:text-white">
        {todos?.map((todo) => (
          <li key={todo.id}>{todo.name}</li>
        ))}
      </ul>
    </div>
  )
}
