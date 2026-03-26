<template>
  <div class="h-full flex flex-col">
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-800">用户管理</h2>
      <el-button type="primary" @click="openUserDialog('create')">
        <el-icon class="mr-1"><Plus /></el-icon>
        新建用户
      </el-button>
    </div>

    <div class="flex-1 bg-white rounded-lg border border-gray-100 overflow-hidden">
      <el-table :data="users" style="width: 100%; height: 100%" v-loading="loading">
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openAssignRolesDialog(row)">分配角色</el-button>
            <el-button link type="warning" size="small" @click="openDirectPermDialog(row)">独立权限</el-button>
            <el-button link type="success" size="small" @click="openUserDialog('edit', row)">编辑</el-button>
            <el-popconfirm title="确认删除该用户吗？" @confirm="handleDeleteUser(row)">
              <template #reference>
                <el-button link type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 用户表单弹窗 -->
    <el-dialog v-model="userDialogVisible" :title="dialogType === 'create' ? '新建用户' : '编辑用户'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="组织" prop="orgId">
          <el-cascader
            v-model="form.orgId"
            :options="orgTree"
            :props="{ checkStrictly: true, value: 'id', label: 'name', emitPath: false }"
            placeholder="请选择所属组织"
            class="w-full"
            clearable
          />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :disabled="dialogType === 'edit'" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="dialogType === 'create'">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUserSubmit" :loading="submitLoading">确认</el-button>
      </template>
    </el-dialog>

    <!-- 分配角色弹窗 -->
    <el-dialog v-model="roleDialogVisible" title="分配角色" width="400px">
      <div v-loading="roleLoading">
        <el-select
          v-model="selectedRoles"
          multiple
          placeholder="请选择角色"
          style="width: 100%"
        >
          <el-option
            v-for="item in availableRoles"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </div>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAssignRoles" :loading="submitLoading">保存</el-button>
      </template>
    </el-dialog>

    <!-- 独立权限弹窗 -->
    <el-drawer v-model="permDialogVisible" title="配置独立权限" size="500px">
      <div v-loading="permLoading" class="h-full flex flex-col">
        <div class="mb-4 text-sm text-gray-500">
          可以直接为该人员授予或拒绝特定的权限资源，优先级高于角色。
        </div>
        <div class="flex-1 overflow-auto">
          <el-table :data="flatPermissions" style="width: 100%" row-key="id" border default-expand-all :tree-props="{ children: 'children' }">
            <el-table-column prop="name" label="权限资源" />
            <el-table-column label="配置类型" width="180">
              <template #default="{ row }">
                <el-radio-group v-model="userPermMap[row.id]" size="small">
                  <el-radio-button label="none">默认</el-radio-button>
                  <el-radio-button label="allow">允许</el-radio-button>
                  <el-radio-button label="deny">拒绝</el-radio-button>
                </el-radio-group>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div class="mt-4 flex justify-end">
          <el-button @click="permDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAssignDirectPerms" :loading="submitLoading">保存配置</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { userApi } from '@/api/user'
import { roleApi } from '@/api/role'
import { permissionApi } from '@/api/permission'
import { organizationApi } from '@/api/organization'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const users = ref<any[]>([])
const loading = ref(false)

const userDialogVisible = ref(false)
const dialogType = ref<'create' | 'edit'>('create')
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const orgTree = ref<any[]>([])

const form = reactive({
  id: '',
  orgId: '',
  username: '',
  password: '',
  name: '',
  phone: '',
  email: '',
  status: 1
})

const rules = reactive<FormRules>({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }]
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await userApi.getUsers()
    if (res.success && res.data) {
      users.value = res.data
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const fetchOrgs = async () => {
  try {
    const res = await organizationApi.getOrganizations()
    if (res.success && res.data) {
      orgTree.value = buildTree(res.data)
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

const openUserDialog = (type: 'create' | 'edit', data?: any) => {
  dialogType.value = type
  if (formRef.value) formRef.value.resetFields()
  
  if (type === 'create') {
    form.id = ''
    form.orgId = ''
    form.username = ''
    form.password = ''
    form.name = ''
    form.phone = ''
    form.email = ''
    form.status = 1
  } else if (data) {
    form.id = data.id
    form.orgId = data.orgId || ''
    form.username = data.username
    form.name = data.name
    form.phone = data.phone
    form.email = data.email
    form.status = data.status
  }
  userDialogVisible.value = true
}

const handleUserSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (dialogType.value === 'create') {
          await userApi.createUser(form)
          ElMessage.success('创建成功')
        } else {
          const { password, ...updateData } = form
          await userApi.updateUser(form.id, updateData)
          ElMessage.success('更新成功')
        }
        userDialogVisible.value = false
        fetchUsers()
      } catch (error: any) {
        ElMessage.error(error.response?.data?.error || '操作失败')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const handleDeleteUser = async (row: any) => {
  try {
    await userApi.deleteUser(row.id)
    ElMessage.success('删除成功')
    fetchUsers()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '删除失败')
  }
}

// Assign Roles
const roleDialogVisible = ref(false)
const roleLoading = ref(false)
const availableRoles = ref<any[]>([])
const selectedRoles = ref<string[]>([])
const currentUser = ref<any>(null)

const fetchAvailableRoles = async () => {
  try {
    const res = await roleApi.getRoles()
    if (res.success && res.data) {
      availableRoles.value = res.data
    }
  } catch (error) {
    console.error(error)
  }
}

const openAssignRolesDialog = async (row: any) => {
  currentUser.value = row
  roleDialogVisible.value = true
  roleLoading.value = true
  
  if (availableRoles.value.length === 0) {
    await fetchAvailableRoles()
  }
  
  selectedRoles.value = row.roles?.map((r: any) => r.roleId) || []
  roleLoading.value = false
}

const handleAssignRoles = async () => {
  if (!currentUser.value) return
  submitLoading.value = true
  try {
    await userApi.assignRoles(currentUser.value.id, selectedRoles.value)
    ElMessage.success('分配角色成功')
    roleDialogVisible.value = false
    fetchUsers()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '分配角色失败')
  } finally {
    submitLoading.value = false
  }
}

// Direct Permissions
const permDialogVisible = ref(false)
const permLoading = ref(false)
const flatPermissions = ref<any[]>([])
const userPermMap = ref<Record<string, string>>({})

const fetchAllPermissions = async () => {
  try {
    const res = await permissionApi.getPermissions()
    if (res.success && res.data) {
      flatPermissions.value = buildTree(res.data)
    }
  } catch (error) {
    console.error(error)
  }
}

const openDirectPermDialog = async (row: any) => {
  currentUser.value = row
  permDialogVisible.value = true
  permLoading.value = true
  
  if (flatPermissions.value.length === 0) {
    await fetchAllPermissions()
  }
  
  userPermMap.value = {}
  
  if (row.permissions && Array.isArray(row.permissions)) {
    row.permissions.forEach((p: any) => {
      userPermMap.value[p.permissionId] = p.type
    })
  }
  
  permLoading.value = false
}

const handleAssignDirectPerms = async () => {
  if (!currentUser.value) return
  submitLoading.value = true
  
  const permissions: { permissionId: string, type: string }[] = []
  for (const [permissionId, type] of Object.entries(userPermMap.value)) {
    if (type === 'allow' || type === 'deny') {
      permissions.push({ permissionId, type })
    }
  }
  
  try {
    await userApi.assignPermissions(currentUser.value.id, permissions)
    ElMessage.success('独立权限配置成功')
    permDialogVisible.value = false
    fetchUsers()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '配置失败')
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  fetchUsers()
  fetchOrgs()
})
</script>
