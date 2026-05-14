import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function saveToWorkspace(
  workspaceId: string,
  assetKey: string,
  assetValue: any
) {
  const { data: workspace } = await supabase
    .from('listing_workspaces')
    .select('assets')
    .eq('id', workspaceId)
    .single()

  const existingAssets = workspace?.assets || {}

  await supabase
    .from('listing_workspaces')
    .update({
      assets: { ...existingAssets, [assetKey]: assetValue },
      updated_at: new Date().toISOString(),
    })
    .eq('id', workspaceId)
}

export async function getUserWorkspaces(userId: string) {
  const { data } = await supabase
    .from('listing_workspaces')
    .select('id, address, city, state, status, assets')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  return data || []
}

export async function createWorkspace(userId: string, address: string) {
  const { data } = await supabase
    .from('listing_workspaces')
    .insert({
      user_id: userId,
      address,
      assets: {},
      notes: '',
      status: 'Active',
    })
    .select('id, address')
    .single()
  return data
}
