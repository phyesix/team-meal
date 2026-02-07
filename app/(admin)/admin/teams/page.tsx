import { createClient } from '@/lib/supabase/server'
import TeamManagementClient from '@/components/admin/TeamManagementClient'

export default async function TeamsManagementPage() {
  const supabase = await createClient()

  const { data: teams, error } = await supabase
    .from('teams')
    .select(`
      *,
      team_members (
        user_id,
        profiles (
          full_name,
          email
        )
      )
    `)
    .order('created_at', { ascending: false })

  console.log('Teams data:', teams)
  console.log('Teams error:', error)
  console.log('Teams count:', teams?.length)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Takım Yönetimi</h1>
      <TeamManagementClient teams={teams || []} />
    </div>
  )
}
