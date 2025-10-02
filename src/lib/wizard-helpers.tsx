import type { Item } from '@/types'

export const sortByItemCode = (items: Item[]) => {
  return items.sort((a, b) => a.code - b.code)
}

export const getParentCode = (parentName: string, parents: Item[]) => {
  const parent = parents.find(p => p.chapter === parentName)
  return (parent?.code || 0) / 100
}

export const getParentsAndChild = (items: Item[], query?: string) => {
  const all = items ?? []
  const search = query?.trim().toLowerCase()
  const parents = all.filter(i => i.code % 100 === 0)
  const children = all.filter(i => i.code % 100 !== 0)

  const group: Record<number, Item[]> = {}
  for (const child of children) {
    const base = Math.floor(child.code / 100) * 100
    if (!group[base]) group[base] = []
    const parent = parents.find(p => p.code === base)
    group[base].push({ ...child, parent_name: parent?.chapter || 'Desconocido' })
  }

  if (search) {
    const matches = (it: Item) =>
      it.name.toLowerCase().includes(search) ||
      it.chapter.toLowerCase().includes(search) ||
      String(it.code).includes(search)

    const filteredParents = parents.filter(p => matches(p) || (group[p.code]?.some(matches) ?? false))
    const filteredGroup: Record<number, Item[]> = {}
    for (const p of filteredParents) {
      const allKids = group[p.code] ?? []
      filteredGroup[p.code] = allKids.filter(matches)
    }
    return {
      parents: filteredParents.sort((a, b) => a.code - b.code),
      childrenByParent: filteredGroup
    }
  }

  for (const k of Object.keys(group)) group?.[+k]?.sort((a, b) => a.code - b.code)
  return {
    parents: parents.sort((a, b) => a.code - b.code),
    childrenByParent: group
  }
}
