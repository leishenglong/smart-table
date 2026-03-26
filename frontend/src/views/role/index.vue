<template>
  <div class="h-full flex flex-col">
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-800">角色权限管理</h2>
      <el-button type="primary" @click="openRoleDialog('create')">
        <el-icon class="mr-1"><Plus /></el-icon>
        新建角色
      </el-button>
    </div>

    <div class="flex-1 bg-white rounded-lg border border-gray-100 overflow-hidden">
      <el-table :data="roles" style="width: 100%; height: 100%" v-loading="loading">
        <el-table-column prop="name" label="角色名称" />
        <el-table-column prop="code" label="角色编码" />
        <el-table-column prop="description" label="描述" />
        <el-table-column label="操作" width="250">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openPermissionDialog(row)">分配权限</el-button>
            <el-button link type="success" size="small" @click="openRoleDialog('edit', row)">编辑</el-button>
            <el-popconfirm title="确认删除该角色吗？" @confirm="handleDeleteRole(row)">
              <template #reference>
                <el-button link type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 角色表单弹窗 -->
    <el-dialog v-model="roleDialogVisible" :title="dialogType === 'create' ? '新建角色' : '编辑角色'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入角色编码" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRoleSubmit" :loading="submitLoading">确认</el-button>
      </template>
    </el-dialog>

    <!-- 权限分配弹窗 -->
    <el-drawer v-model="permDialogVisible" title="分配权限" size="400px">
      <div v-loading="permLoading" class="h-full flex flex-col">
        <el-tree
          ref="treeRef"
          :data="permissionsTree"
          show-checkbox
          node-key="id"
          :props="{ children: 'children', label: 'name' }"
          default-expand-all
          class="flex-1 overflow-auto"
        >
          <template #default="{ data }">
            <div class="flex items-center">
              <span>{{ data.name }}</span>
              <el-tag size="small" class="ml-2" :type="data.type === 'menu' ? 'primary' : 'warning'">
                {{ data.type === 'menu' ? '菜单' : data.type === 'button' ? '按钮' : 'API' }}
              </el-tag>
            </div>
          </template>
        </el-tree>
        <div class="mt-4 flex justify-end">
          <el-button @click="permDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAssignPermissions" :loading="submitLoading">保存配置</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { roleApi } from '@/api/role'
import { permissionApi } from '@/api/permission'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const roles = ref<any[]>([])
const loading = ref(false)

const roleDialogVisible = ref(false)
const dialogType = ref<'create' | 'edit'>('create')
const submitLoading = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  id: '',
  name: '',
  code: '',
  description: ''
})

const rules = reactive<FormRules>({
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }]
})

const fetchRoles = async () => {
  loading.value = true
  try {
    const res = await roleApi.getRoles()
    if (res.success && res.data) {
      roles.value = res.data
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const openRoleDialog = (type: 'create' | 'edit', data?: any) => {
  dialogType.value = type
  if (formRef.value) formRef.value.resetFields()
  
  if (type === 'create') {
    form.id = ''
    form.name = ''
    form.code = ''
    form.description = ''
  } else if (data) {
    form.id = data.id
    form.name = data.name
    form.code = data.code
    form.description = data.description
  }
  roleDialogVisible.value = true
}

const handleRoleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (dialogType.value === 'create') {
          await roleApi.createRole(form)
          ElMessage.success('创建成功')
        } else {
          await roleApi.updateRole(form.id, form)
          ElMessage.success('更新成功')
        }
        roleDialogVisible.value = false
        fetchRoles()
      } catch (error: any) {
        ElMessage.error(error.response?.data?.error || '操作失败')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const handleDeleteRole = async (row: any) => {
  try {
    await roleApi.deleteRole(row.id)
    ElMessage.success('删除成功')
    fetchRoles()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '删除失败')
  }
}

// Permissions
const permDialogVisible = ref(false)
const permissionsTree = ref<any[]>([])
const treeRef = ref<any>()
const currentRole = ref<any>(null)
const permLoading = ref(false)

const fetchPermissions = async () => {
  try {
    const res = await permissionApi.getPermissions()
    if (res.success && res.data) {
      permissionsTree.value = buildTree(res.data)
    }
  } catch (error) {
    console.error(error)
  }
}

const buildTree = (data: any[], parentId: string | null = null): any[] => {
  if (data.length > 0 && data[0].children) return data
  return data
    .filter(item => item.parentId === parentId)
    .sort((a, b) => a.sort - b.sort)
    .map(item => ({
      ...item,
      children: buildTree(data, item.id)
    }))
}

const openPermissionDialog = async (row: any) => {
  currentRole.value = row
  permDialogVisible.value = true
  permLoading.value = true
  
  if (permissionsTree.value.length === 0) {
    await fetchPermissions()
  }
  
  const checkedKeys = row.permissions?.map((p: any) => p.permissionId) || []
  setTimeout(() => {
    if (treeRef.value) {
      treeRef.value.setCheckedKeys(checkedKeys)
    }
    permLoading.value = false
  }, 100)
}

const handleAssignPermissions = async () => {
  if (!treeRef.value || !currentRole.value) return
  submitLoading.value = true
  
  const checkedKeys = treeRef.value.getCheckedKeys()
  const halfCheckedKeys = treeRef.value.getHalfCheckedKeys()
  const allKeys = [...checkedKeys, ...halfCheckedKeys]
  
  try {
    await roleApi.assignPermissions(currentRole.value.id, allKeys)
    ElMessage.success('权限分配成功')
    permDialogVisible.value = false
    fetchRoles()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '权限分配失败')
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  fetchRoles()
})
</script>
