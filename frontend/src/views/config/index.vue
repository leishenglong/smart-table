<template>
  <div class="min-h-screen bg-background flex">
    <!-- 左侧字段面板 -->
    <div class="w-80 bg-white border-r flex flex-col">
      <div class="p-4 border-b">
        <h2 class="text-lg font-medium text-text-primary">字段配置</h2>
      </div>
      
      <div class="flex-1 p-4 overflow-auto">
        <div class="space-y-3">
          <div
            v-for="(field, index) in fields"
            :key="index"
            class="p-3 border rounded-lg cursor-pointer hover:border-primary transition-colors"
            :class="{ 'border-primary bg-primary/5': selectedFieldIndex === index }"
            @click="selectField(index)"
          >
            <div class="flex items-center justify-between">
              <span class="font-medium text-text-primary">{{ field.name }}</span>
              <span class="text-sm text-text-tertiary">{{ field.type }}</span>
            </div>
          </div>
        </div>
        
        <el-button
          class="w-full mt-4"
          @click="addField"
        >
          <template #icon>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
          </template>
          添加字段
        </el-button>
      </div>
    </div>

    <!-- 中间预览区 -->
    <div class="flex-1 flex flex-col">
      <!-- 顶部操作栏 -->
      <div class="h-16 bg-white border-b flex items-center px-6 justify-between">
        <div class="flex items-center gap-4">
          <button @click="goBack" class="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
          </button>
          <input
            v-model="tableName"
            type="text"
            placeholder="表格名称"
            class="text-lg font-medium text-text-primary bg-transparent border-none outline-none"
          />
        </div>
        <div class="flex items-center gap-3">
          <el-button @click="openAllowedOrgsDialog" type="warning" plain>授权管理</el-button>
          <el-button @click="saveConfig" type="primary">保存配置</el-button>
          <el-button v-if="tableId && fields.length > 0" @click="goToTable" type="success">查看表格</el-button>
        </div>
      </div>

      <!-- 预览区内容 -->
      <div class="flex-1 p-6 overflow-auto">
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h3 class="text-lg font-medium text-text-primary mb-4">表格预览</h3>

          <el-table :data="previewData" border>
            <el-table-column type="index" label="#" width="60" />
            <el-table-column
              v-for="field in fields"
              :key="field.name"
              :prop="field.name"
              :label="field.name"
            >
              <template #default>
                <span class="text-text-tertiary">{{ getFieldTypePlaceholder(field.type) }}</span>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="fields.length === 0" class="text-center py-12 text-text-tertiary">
            <div class="mb-4">暂无字段，请添加字段</div>
            <el-button type="primary" @click="addField">添加第一个字段</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧属性面板 -->
    <div class="w-80 bg-white border-l flex flex-col">
      <div class="p-4 border-b">
        <h2 class="text-lg font-medium text-text-primary">字段属性</h2>
      </div>
      
      <div v-if="selectedField" class="flex-1 p-4 overflow-auto">
        <el-form :model="selectedField" label-width="80px">
          <el-form-item label="字段名称">
            <el-input v-model="selectedField.name" placeholder="请输入字段名称" />
          </el-form-item>
          
          <el-form-item label="字段类型">
            <el-select v-model="selectedField.type" class="w-full">
              <el-option label="文本" value="text" />
              <el-option label="数字" value="number" />
              <el-option label="日期" value="date" />
              <el-option label="邮箱" value="email" />
              <el-option label="手机号" value="phone" />
              <el-option label="下拉选择" value="select" />
              <el-option label="复选框" value="checkbox" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="必填">
            <el-checkbox v-model="selectedField.required" />
          </el-form-item>
          
          <el-form-item label="固定列">
            <el-select v-model="selectedField.config.fixed" class="w-full" clearable placeholder="不固定">
              <el-option label="左侧固定" value="left" />
              <el-option label="右侧固定" value="right" />
            </el-select>
          </el-form-item>
          
          <el-form-item v-if="selectedField.type === 'select'" label="选项">
            <div class="w-full space-y-2">
              <div
                v-for="(option, index) in selectedField.config.options || []"
                :key="index"
                class="flex items-center gap-2"
              >
                <el-input v-model="selectedField.config.options![index]" size="small" />

                <el-button
                  size="small"
                  type="danger"
                  text
                  @click="removeOption(index)"
                >
                  删除
                </el-button>
              </div>
              <el-button size="small" @click="addOption">添加选项</el-button>
            </div>
          </el-form-item>
          
          <el-form-item v-if="selectedField.type === 'number'" label="最小值">
            <el-input-number v-model="selectedField.config.min" class="w-full" />
          </el-form-item>
          
          <el-form-item v-if="selectedField.type === 'number'" label="最大值">
            <el-input-number v-model="selectedField.config.max" class="w-full" />
          </el-form-item>
          
          <el-form-item label="删除字段">
            <el-button type="danger" @click="deleteField">删除此字段</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <div v-else class="flex-1 flex items-center justify-center text-text-tertiary">
        请选择字段进行配置
      </div>
    </div>

    <!-- 授权组织选择对话框 -->
    <el-dialog
      v-model="showAllowedOrgsDialog"
      title="表格授权管理"
      width="500px"
      class="!rounded-2xl"
      :close-on-click-modal="false"
    >
      <div class="space-y-4">
        <p class="text-sm text-text-secondary">
          设置哪些组织可以访问此表格。创建者始终有权限访问。
        </p>
        <el-tree-select
          v-model="tempAllowedOrgs"
          :data="orgTreeData"
          :props="{ label: 'name', children: 'children', value: 'id' }"
          placeholder="选择授权组织"
          multiple
          check-strictly
          show-checkbox
          clearable
          class="!w-full"
          :render-after-expand="false"
        />
        <div class="text-xs text-text-tertiary">
          <el-icon class="mr-1"><Info /></el-icon>
          授权给父组织后，其子组织将自动继承访问权限
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button @click="showAllowedOrgsDialog = false" class="!rounded-lg">取消</el-button>
          <el-button type="primary" @click="saveAllowedOrgs" class="!rounded-lg" :loading="savingAllowedOrgs">保存授权</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 字段类型选择对话框 -->
    <el-dialog v-model="showFieldDialog" title="选择字段类型" width="400px">
      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="type in fieldTypes"
          :key="type.value"
          class="border rounded-lg p-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
          @click="createField(type.value)"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-sm font-semibold text-primary">
              {{ type.label.slice(0, 1) }}
            </div>
            <div>

              <div class="font-medium text-text-primary">{{ type.label }}</div>
              <div class="text-sm text-text-tertiary">{{ type.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { tableApi } from '@/api/table'
import { organizationApi } from '@/api/organization'
import type { TableField, FieldType } from '@/types/table'
import { Info } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const tableId = computed(() => route.params.id as string)
const tableName = ref('新建表格')
const fields = ref<TableField[]>([])
const selectedFieldIndex = ref<number | null>(null)
const showFieldDialog = ref(false)

// 授权组织管理
const showAllowedOrgsDialog = ref(false)
const tempAllowedOrgs = ref<string[]>([])
const orgTreeData = ref<any[]>([])
const savingAllowedOrgs = ref(false)

const selectedField = computed(() => {
  if (selectedFieldIndex.value === null) return null
  return fields.value[selectedFieldIndex.value]
})

const previewData = computed(() => {
  if (fields.value.length === 0) return []
  return [{}]
})

const fieldTypes: Array<{ value: FieldType; label: string; desc: string }> = [
  { value: 'text', label: '文本', desc: '短文本输入' },
  { value: 'number', label: '数字', desc: '数值输入' },
  { value: 'date', label: '日期', desc: '日期选择' },
  { value: 'email', label: '邮箱', desc: '邮箱格式' },
  { value: 'phone', label: '手机号', desc: '手机号格式' },
  { value: 'select', label: '下拉选择', desc: '单选下拉' },
  { value: 'checkbox', label: '复选框', desc: '是/否' }
]


const getFieldTypePlaceholder = (type: FieldType) => {
  const placeholders: Record<FieldType, string> = {
    text: '文本内容',
    number: '123',
    date: '2024-01-01',
    email: 'example@email.com',
    phone: '13800138000',
    select: '请选择',
    checkbox: '是/否'
  }
  return placeholders[type]
}

const addField = () => {
  showFieldDialog.value = true
}

const createField = (type: FieldType) => {
  const newField: TableField = {
    name: `字段${fields.value.length + 1}`,
    type,
    required: false,
    config: type === 'select' ? { options: ['选项1', '选项2'] } : {}
  }
  fields.value.push(newField)
  selectedFieldIndex.value = fields.value.length - 1
  showFieldDialog.value = false
}

const selectField = (index: number) => {
  selectedFieldIndex.value = index
}

const deleteField = () => {
  if (selectedFieldIndex.value === null) return
  fields.value.splice(selectedFieldIndex.value, 1)
  selectedFieldIndex.value = null
}

const addOption = () => {
  if (!selectedField.value?.config.options) {
    selectedField.value!.config.options = []
  }
  selectedField.value!.config.options.push(`选项${selectedField.value!.config.options.length + 1}`)
}

const removeOption = (index: number) => {
  selectedField.value?.config.options?.splice(index, 1)
}

const loadConfig = async () => {
  if (!tableId.value) return
  
  try {
    const res = await tableApi.getTable(tableId.value)
    if (res.success && res.data) {
      tableName.value = res.data.name
      fields.value = res.data.fields.map(f => ({
        ...f,
        config: typeof f.config === 'string' ? JSON.parse(f.config) : f.config
      }))
    }
  } catch (error) {
    console.error(error)
  }
}

const saveConfig = async () => {
  if (!tableName.value) {
    ElMessage.warning('请输入表格名称')
    return
  }
  
  try {
    if (tableId.value) {
      await tableApi.updateTable(tableId.value, {
        name: tableName.value
      })
      await tableApi.updateFields(tableId.value, fields.value)
    } else {
      const res = await tableApi.createTable({
        name: tableName.value,
        fields: fields.value
      })
      if (res.success && res.data?.id) {
        router.replace(`/config/${res.data.id}`)
      }
    }
    ElMessage.success('保存成功')
  } catch (error) {
    console.error(error)
    ElMessage.error('保存失败')
  }
}

const goToTable = () => {
  if (tableId.value) {
    router.push(`/table/${tableId.value}`).catch(err => {
      console.error('导航失败:', err)
      ElMessage.error('跳转到表格失败')
    })
  } else {
    ElMessage.warning('请先保存表格配置')
  }
}

const goBack = () => {
  router.push('/')
}

// 加载组织树
const loadOrgTree = async () => {
  try {
    const res = await organizationApi.getOrganizationTree()
    if (res.success && res.data) {
      orgTreeData.value = res.data
    }
  } catch (error) {
    console.error(error)
  }
}

// 打开授权对话框
const openAllowedOrgsDialog = async () => {
  if (!tableId.value) {
    ElMessage.warning('请先保存表格后再设置授权')
    return
  }
  await loadOrgTree()
  // 从当前表格配置中获取 allowedOrgs
  try {
    const res = await tableApi.getTable(tableId.value)
    if (res.success && res.data) {
      const allowedOrgs = res.data.allowedOrgs
      tempAllowedOrgs.value = allowedOrgs ? JSON.parse(allowedOrgs) : []
    }
  } catch (error) {
    console.error(error)
    tempAllowedOrgs.value = []
  }
  showAllowedOrgsDialog.value = true
}

// 保存授权设置
const saveAllowedOrgs = async () => {
  if (!tableId.value) return

  savingAllowedOrgs.value = true
  try {
    await tableApi.updateAllowedOrgs(tableId.value, tempAllowedOrgs.value)
    ElMessage.success('授权设置已保存')
    showAllowedOrgsDialog.value = false
  } catch (error: any) {
    ElMessage.error(error?.message || '保存授权失败')
  } finally {
    savingAllowedOrgs.value = false
  }
}

onMounted(() => {
  loadConfig()
  loadOrgTree()
})
</script>
