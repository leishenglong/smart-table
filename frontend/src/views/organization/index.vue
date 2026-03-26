<template>
  <div class="h-full flex flex-col">
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-800">组织架构管理</h2>
      <el-button type="primary" @click="openDialog('create')">
        <el-icon class="mr-1"><Plus /></el-icon>
        新建顶级组织
      </el-button>
    </div>

    <div class="flex-1 overflow-auto bg-gray-50/50 rounded-lg border border-gray-100 p-4">
      <el-tree
        :data="orgTree"
        :props="defaultProps"
        node-key="id"
        default-expand-all
        :expand-on-click-node="false"
        class="!bg-transparent"
      >
        <template #default="{ node, data }">
          <div class="flex-1 flex items-center justify-between pr-4 py-1 hover:bg-gray-100/50 rounded transition-colors group">
            <div class="flex items-center space-x-2">
              <el-tag size="small" :type="getTypeTag(data.type).type" effect="light">
                {{ getTypeTag(data.type).label }}
              </el-tag>
              <span class="text-sm font-medium text-gray-700">{{ data.name }}</span>
              <span class="text-xs text-gray-400">({{ data.code }})</span>
            </div>
            
            <div class="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
              <el-button link type="primary" size="small" @click.stop="openDialog('create', data)">
                添加下级
              </el-button>
              <el-button link type="success" size="small" @click.stop="openDialog('edit', data)">
                编辑
              </el-button>
              <el-popconfirm title="确认删除该组织吗？" @confirm="handleDelete(data)">
                <template #reference>
                  <el-button link type="danger" size="small" @click.stop>删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
        </template>
      </el-tree>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新建组织' : '编辑组织'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="pr-6"
      >
        <el-form-item label="上级组织" v-if="parentName">
          <el-input v-model="parentName" disabled />
        </el-form-item>
        <el-form-item label="组织名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入组织名称" />
        </el-form-item>
        <el-form-item label="组织编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入组织编码" />
        </el-form-item>
        <el-form-item label="组织类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择组织类型" class="w-full">
            <el-option label="集团 (Group)" value="group" />
            <el-option label="公司 (Company)" value="company" />
            <el-option label="部门 (Department)" value="department" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { organizationApi } from '@/api/organization'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const orgTree = ref<any[]>([])
const defaultProps = {
  children: 'children',
  label: 'name',
}

const dialogVisible = ref(false)
const dialogType = ref<'create' | 'edit'>('create')
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const parentName = ref('')

const form = reactive({
  id: '',
  parentId: '',
  name: '',
  code: '',
  type: 'department',
  sort: 0
})

const rules = reactive<FormRules>({
  name: [{ required: true, message: '请输入组织名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入组织编码', trigger: 'blur' }],
  type: [{ required: true, message: '请选择组织类型', trigger: 'change' }]
})

const getTypeTag = (type: string) => {
  const map: Record<string, { label: string, type: '' | 'success' | 'warning' | 'info' | 'danger' }> = {
    group: { label: '集团', type: 'danger' },
    company: { label: '公司', type: 'warning' },
    department: { label: '部门', type: 'info' }
  }
  return map[type] || { label: '未知', type: 'info' }
}

const fetchOrganizations = async () => {
  try {
    const res = await organizationApi.getOrganizations()
    if (res.success && res.data) {
      orgTree.value = buildTree(res.data)
    }
  } catch (error) {
    console.error('Failed to fetch organizations', error)
  }
}

const buildTree = (data: any[], parentId: string | null = null): any[] => {
  if (data.length > 0 && data[0].children) {
    return data
  }
  return data
    .filter(item => item.parentId === parentId)
    .sort((a, b) => a.sort - b.sort)
    .map(item => ({
      ...item,
      children: buildTree(data, item.id)
    }))
}

const openDialog = (type: 'create' | 'edit', data?: any) => {
  dialogType.value = type
  parentName.value = ''
  
  if (formRef.value) {
    formRef.value.resetFields()
  }

  if (type === 'create') {
    form.id = ''
    form.parentId = data ? data.id : null
    form.name = ''
    form.code = ''
    form.type = data?.type === 'group' ? 'company' : 'department'
    form.sort = 0
    if (data) parentName.value = data.name
  } else if (data) {
    form.id = data.id
    form.parentId = data.parentId
    form.name = data.name
    form.code = data.code
    form.type = data.type
    form.sort = data.sort
  }
  
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (dialogType.value === 'create') {
          const res = await organizationApi.createOrganization(form)
          if (res.success) {
            ElMessage.success('创建成功')
            dialogVisible.value = false
            fetchOrganizations()
          } else {
            ElMessage.error(res.message || '创建失败')
          }
        } else {
          const res = await organizationApi.updateOrganization(form.id, form)
          if (res.success) {
            ElMessage.success('更新成功')
            dialogVisible.value = false
            fetchOrganizations()
          } else {
            ElMessage.error(res.message || '更新失败')
          }
        }
      } catch (error: any) {
        ElMessage.error(error.response?.data?.error || '操作失败')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const handleDelete = async (data: any) => {
  try {
    const res = await organizationApi.deleteOrganization(data.id)
    if (res.success) {
      ElMessage.success('删除成功')
      fetchOrganizations()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '删除失败')
  }
}

onMounted(() => {
  fetchOrganizations()
})
</script>
