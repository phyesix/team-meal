import { createClient } from '@/lib/supabase/server'
import UserManagementClient from '@/components/admin/UserManagementClient'

export default async function UsersManagementPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('profiles')
    .select(`
      *,
      team_members (
        team_id,
        teams (
          name
        )
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Kullanıcı Yönetimi</h1>
      <UserManagementClient users={users || []} />
    </div>
  )
}
