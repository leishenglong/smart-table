<template>
  <div class="h-full flex flex-col">
    <div class="mb-4 flex justify-between items-center">
      <div>
        <h2 class="text-xl font-bold text-gray-800">权限资源管理</h2>
        <p class="mt-1 text-sm text-gray-500">统一维护菜单、按钮与接口权限资源，供角色和用户授权使用。</p>
      </div>
      <el-button type="primary" @click="openDialog('create')">
        <el-icon class="mr-1"><Plus /></el-icon>
        新建顶级权限
      </el-button>
    </div>

    <div class="flex-1 bg-white rounded-lg border border-gray-100 overflow-hidden">
      <el-table
        :data="permissionTree"
        row-key="id"
        border
        default-expand-all
        v-loading="loading"
        :tree-props="{ children: 'children' }"
        style="width: 100%; height: 100%"
      >
        <el-table-column prop="name" label="权限名称" min-width="220" />
        <el-table-column prop="code" label="权限编码" min-width="220" />
        <el-table-column label="资源类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeMeta(row.type).type" effect="light">
              {{ getTypeMeta(row.type).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="90" align="center" />
        <el-table-column label="操作" min-width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDialog('create', row)">添加下级</el-button>
            <el-button link type="success" size="small" @click="openDialog('edit', row)">编辑</el-button>
            <el-popconfirm title="确认删除该权限资源吗？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button link type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新建权限资源' : '编辑权限资源'"
      width="560px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="pr-6">
        <el-form-item label="上级权限">
          <el-tree-select
            v-model="form.parentId"
            :data="parentOptions"
            node-key="id"
            check-strictly
            clearable
            default-expand-all
            :render-after-expand="false"
            :props="{ label: 'name', children: 'children', value: 'id' }"
            class="w-full"
            placeholder="不选择则为顶级权限"
          />
        </el-form-item>
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入权限名称" />
        </el-form-item>
        <el-form-item label="权限编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入权限编码，如 user:manage" />
        </el-form-item>
        <el-form-item label="资源类型" prop="type">
          <el-select v-model="form.type" class="w-full" placeholder="请选择资源类型">
            <el-option label="菜单" value="menu" />
            <el-option label="按钮" value="button" />
            <el-option label="接口" value="api" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { permissionApi } from '@/api/permission'

type PermissionType = 'menu' | 'button' | 'api'

type PermissionItem = {
  id: string
  name: string
  code: string
  type: PermissionType
  parentId: string | null
  sort: number
  children?: PermissionItem[]
}

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref<'create' | 'edit'>('create')
const formRef = ref<FormInstance>()
const permissionTree = ref<PermissionItem[]>([])

const form = reactive({
  id: '',
  parentId: '',
  name: '',
  code: '',
  type: 'menu' as PermissionType,
  sort: 0,
})

const rules = reactive<FormRules>({
  name: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入权限编码', trigger: 'blur' }],
  type: [{ required: true, message: '请选择资源类型', trigger: 'change' }],
})

const getTypeMeta = (type: PermissionType) => {
  const map: Record<PermissionType, { label: string; type: 'primary' | 'success' | 'warning' | 'info' | 'danger' }> = {
    menu: { label: '菜单', type: 'primary' },
    button: { label: '按钮', type: 'warning' },
    api: { label: '接口', type: 'success' },
  }

  return map[type] || { label: type, type: 'info' }
}


const buildTree = (data: PermissionItem[], parentId: string | null = null): PermissionItem[] => {
  if (data.length > 0 && data[0].children) {
    return data
  }

  return data
    .filter(item => item.parentId === parentId)
    .sort((a, b) => a.sort - b.sort)
    .map(item => ({
      ...item,
      children: buildTree(data, item.id),
    }))
}

const collectDescendantIds = (node?: PermissionItem): string[] => {
  if (!node) return []

  return [
    node.id,
    ...(node.children || []).flatMap(child => collectDescendantIds(child)),
  ]
}

const filterTree = (nodes: PermissionItem[], excludedIds: Set<string>): PermissionItem[] => {
  return nodes
    .filter(node => !excludedIds.has(node.id))
    .map(node => ({
      ...node,
      children: filterTree(node.children || [], excludedIds),
    }))
}

const parentOptions = computed(() => {
  if (dialogType.value !== 'edit' || !form.id) {
    return permissionTree.value
  }

  const currentNode = findPermission(permissionTree.value, form.id)
  const excludedIds = new Set(collectDescendantIds(currentNode))
  return filterTree(permissionTree.value, excludedIds)
})

const findPermission = (nodes: PermissionItem[], id: string): PermissionItem | undefined => {
  for (const node of nodes) {
    if (node.id === id) return node
    const matched = findPermission(node.children || [], id)
    if (matched) return matched
  }

  return undefined
}

const resetForm = () => {
  form.id = ''
  form.parentId = ''
  form.name = ''
  form.code = ''
  form.type = 'menu'
  form.sort = 0
}

const fetchPermissions = async () => {
  loading.value = true
  try {
    const res = await permissionApi.getPermissions()
    if (res.success && Array.isArray(res.data)) {
      permissionTree.value = buildTree(res.data)
    } else {
      permissionTree.value = []
    }
  } catch (error) {
    console.error('Failed to fetch permissions', error)
  } finally {
    loading.value = false
  }
}

const openDialog = (type: 'create' | 'edit', data?: PermissionItem) => {
  dialogType.value = type
  resetForm()
  formRef.value?.clearValidate()

  if (type === 'create') {
    form.parentId = data?.id || ''
    form.type = data?.type === 'menu' ? 'button' : data?.type || 'menu'
  } else if (data) {
    form.id = data.id
    form.parentId = data.parentId || ''
    form.name = data.name
    form.code = data.code
    form.type = data.type
    form.sort = data.sort
  }

  dialogVisible.value = true
}

const getPayload = () => ({
  parentId: form.parentId || null,
  name: form.name.trim(),
  code: form.code.trim(),
  type: form.type,
  sort: form.sort,
})

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async valid => {
    if (!valid) return

    submitLoading.value = true
    try {
      const payload = getPayload()
      if (dialogType.value === 'create') {
        await permissionApi.createPermission(payload)
        ElMessage.success('创建成功')
      } else {
        await permissionApi.updatePermission(form.id, payload)
        ElMessage.success('更新成功')
      }

      dialogVisible.value = false
      await fetchPermissions()
    } catch (error: any) {
      ElMessage.error(error.response?.data?.error || '操作失败')
    } finally {
      submitLoading.value = false
    }
  })
}

const handleDelete = async (row: PermissionItem) => {
  try {
    await permissionApi.deletePermission(row.id)
    ElMessage.success('删除成功')
    await fetchPermissions()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '删除失败')
  }
}

onMounted(() => {
  fetchPermissions()
})
</script>
