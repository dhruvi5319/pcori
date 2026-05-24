export interface TaxonomyCategory {
  id: string
  code: string
  name: string
  description?: string
  parentId?: string
  parentCode?: string
  isActive: boolean
  level: number // 0=root/PCC, 1=category, 2=code, 3=subcode
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface TaxonomyTreeNode {
  category: TaxonomyCategory
  children: TaxonomyTreeNode[]
}

export interface CreateTaxonomyRequest {
  code: string // 1–50 chars; unique within parent
  name: string // 1–255 chars
  description?: string
  parentId?: string
  level: number
  displayOrder?: number
}

export interface UpdateTaxonomyRequest {
  code?: string
  name?: string
  description?: string
  displayOrder?: number
}
