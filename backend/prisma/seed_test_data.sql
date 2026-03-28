-- ============================================
-- 华新科技集团 - 完整测试数据
-- 组织结构：集团 -> 分公司 -> 部门 -> 小组（4级）
-- ============================================

-- 插入测试租户
INSERT INTO tenants (id, name, code, description, createdAt, updatedAt) VALUES
('tenant-001', '华新科技集团', 'hxkj', '华新科技集团有限公司', datetime('now'), datetime('now'));

-- ============================================
-- 组织架构（4级：集团 -> 分公司 -> 部门 -> 小组）
-- ============================================

-- 第1级：集团
INSERT INTO organizations (id, tenantId, parentId, name, code, type, sort, createdAt, updatedAt) VALUES
('org-001', 'tenant-001', NULL, '华新科技集团总部', 'HQ', 'group', 1, datetime('now'), datetime('now'));

-- 第2级：分公司
INSERT INTO organizations (id, tenantId, parentId, name, code, type, sort, createdAt, updatedAt) VALUES
('org-002', 'tenant-001', 'org-001', '北京分公司', 'BJ', 'company', 1, datetime('now'), datetime('now')),
('org-003', 'tenant-001', 'org-001', '上海分公司', 'SH', 'company', 2, datetime('now'), datetime('now')),
('org-004', 'tenant-001', 'org-001', '深圳分公司', 'SZ', 'company', 3, datetime('now'), datetime('now'));

-- 第3级：部门
INSERT INTO organizations (id, tenantId, parentId, name, code, type, sort, createdAt, updatedAt) VALUES
-- 北京分公司部门
('org-005', 'tenant-001', 'org-002', '研发部', 'BJ-RD', 'department', 1, datetime('now'), datetime('now')),
('org-006', 'tenant-001', 'org-002', '市场部', 'BJ-MK', 'department', 2, datetime('now'), datetime('now')),
('org-007', 'tenant-001', 'org-002', '财务部', 'BJ-FIN', 'department', 3, datetime('now'), datetime('now')),
-- 上海分公司部门
('org-008', 'tenant-001', 'org-003', '技术部', 'SH-TC', 'department', 1, datetime('now'), datetime('now')),
('org-009', 'tenant-001', 'org-003', '销售部', 'SH-SALES', 'department', 2, datetime('now'), datetime('now')),
('org-010', 'tenant-001', 'org-003', '人事部', 'SH-HR', 'department', 3, datetime('now'), datetime('now')),
-- 深圳分公司部门
('org-011', 'tenant-001', 'org-004', '运维部', 'SZ-OPS', 'department', 1, datetime('now'), datetime('now')),
('org-012', 'tenant-001', 'org-004', '客服部', 'SZ-CS', 'department', 2, datetime('now'), datetime('now')),
('org-013', 'tenant-001', 'org-004', '财务部', 'SZ-FIN', 'department', 3, datetime('now'), datetime('now'));

-- 第4级：小组
INSERT INTO organizations (id, tenantId, parentId, name, code, type, sort, createdAt, updatedAt) VALUES
-- 研发部分组
('org-014', 'tenant-001', 'org-005', '前端组', 'BJ-RD-FE', 'department', 1, datetime('now'), datetime('now')),
('org-015', 'tenant-001', 'org-005', '后端组', 'BJ-RD-BE', 'department', 2, datetime('now'), datetime('now')),
('org-016', 'tenant-001', 'org-005', '测试组', 'BJ-RD-QA', 'department', 3, datetime('now'), datetime('now')),
-- 技术部分组
('org-017', 'tenant-001', 'org-008', '基础架构组', 'SH-TC-IA', 'department', 1, datetime('now'), datetime('now')),
('org-018', 'tenant-001', 'org-008', '应用支持组', 'SH-TC-AS', 'department', 2, datetime('now'), datetime('now')),
-- 运维部分组
('org-019', 'tenant-001', 'org-011', '运维一组', 'SZ-OPS-1', 'department', 1, datetime('now'), datetime('now')),
('org-020', 'tenant-001', 'org-011', '运维二组', 'SZ-OPS-2', 'department', 2, datetime('now'), datetime('now'));

-- ============================================
-- 用户（每个关键组织都有用户）
-- ============================================
INSERT INTO users (id, tenantId, orgId, username, password, name, phone, email, status, createdAt, updatedAt) VALUES
-- 集团层面
('user-001', 'tenant-001', 'org-001', 'admin', 'e10adc3949ba59abbe56e057f20f883e', '系统管理员', '13800000001', 'admin@hxkj.com', 1, datetime('now'), datetime('now')),
('user-002', 'tenant-001', 'org-001', 'zhaoyong', 'e10adc3949ba59abbe56e057f20f883e', '赵勇（集团副总）', '13800000002', 'zhaoyong@hxkj.com', 1, datetime('now'), datetime('now')),

-- 北京分公司
('user-003', 'tenant-001', 'org-002', 'wangfeng', 'e10adc3949ba59abbe56e057f20f883e', '王峰（北分总经理）', '13800000003', 'wangfeng@bj.hxkj.com', 1, datetime('now'), datetime('now')),
('user-004', 'tenant-001', 'org-005', 'liuyang', 'e10adc3949ba59abbe56e057f20f883e', '刘洋（研发经理）', '13800000004', 'liuyang@bj.hxkj.com', 1, datetime('now'), datetime('now')),
('user-005', 'tenant-001', 'org-006', 'sunli', 'e10adc3949ba59abbe56e057f20f883e', '孙丽（市场经理）', '13800000005', 'sunli@bj.hxkj.com', 1, datetime('now'), datetime('now')),
('user-006', 'tenant-001', 'org-014', 'zhaoming', 'e10adc3949ba59abbe56e057f20f883e', '赵明（前端组长）', '13800000006', 'zhaoming@bj.hxkj.com', 1, datetime('now'), datetime('now')),
('user-007', 'tenant-001', 'org-015', 'qianchen', 'e10adc3949ba59abbe56e057f20f883e', '钱晨（后端组长）', '13800000007', 'qianchen@bj.hxkj.com', 1, datetime('now'), datetime('now')),

-- 上海分公司
('user-008', 'tenant-001', 'org-003', 'zhouhua', 'e10adc3949ba59abbe56e057f20f883e', '周华（上分总经理）', '13800000008', 'zhouhua@sh.hxkj.com', 1, datetime('now'), datetime('now')),
('user-009', 'tenant-001', 'org-008', 'wujie', 'e10adc3949ba59abbe56e057f20f883e', '吴杰（技术经理）', '13800000009', 'wujie@sh.hxkj.com', 1, datetime('now'), datetime('now')),
('user-010', 'tenant-001', 'org-009', 'zhengna', 'e10adc3949ba59abbe56e057f20f883e', '郑娜（销售经理）', '13800000010', 'zhengna@sh.hxkj.com', 1, datetime('now'), datetime('now')),
('user-011', 'tenant-001', 'org-017', 'fengbin', 'e10adc3949ba59abbe56e057f20f883e', '冯斌（架构组长）', '13800000011', 'fengbin@sh.hxkj.com', 1, datetime('now'), datetime('now')),

-- 深圳分公司
('user-012', 'tenant-001', 'org-004', 'lisong', 'e10adc3949ba59abbe56e057f20f883e', '李松（深分总经理）', '13800000012', 'lisong@sz.hxkj.com', 1, datetime('now'), datetime('now')),
('user-013', 'tenant-001', 'org-011', 'tangyin', 'e10adc3949ba59abbe56e057f20f883e', '唐寅（运维经理）', '13800000013', 'tangyin@sz.hxkj.com', 1, datetime('now'), datetime('now')),
('user-014', 'tenant-001', 'org-019', 'helixing', 'e10adc3949ba59abbe56e057f20f883e', '何立行（运维组长）', '13800000014', 'helixing@sz.hxkj.com', 1, datetime('now'), datetime('now'));

-- ============================================
-- 表格配置（带完整权限配置）
-- ============================================
-- createdBy: 创建者用户ID
-- allowedOrgs: JSON数组，允许访问的组织ID列表
INSERT INTO table_configs (id, tenantId, createdBy, name, description, config, allowedOrgs, createdAt, updatedAt) VALUES
-- 表格1：员工信息表 - 集团创建，授权给集团和所有分公司（组织树继承）
('table-001', 'tenant-001', 'user-001', '员工信息表', '记录集团全体员工基本信息', '{}',
 '["org-001","org-002","org-003","org-004"]', datetime('now'), datetime('now')),

-- 表格2：项目进度表 - 集团创建，仅授权给北京分公司
('table-002', 'tenant-001', 'user-001', '项目进度表', '跟踪各项目完成情况', '{}',
 '["org-002"]', datetime('now'), datetime('now')),

-- 表格3：设备清单 - 北京分公司创建，授权给自己和集团
('table-003', 'tenant-001', 'user-004', '北京分公司设备清单', '北京分公司固定资产登记', '{}',
 '["org-001","org-002"]', datetime('now'), datetime('now')),

-- 表格4：月度销售报表 - 集团创建，授权给集团和所有分公司
('table-004', 'tenant-001', 'user-001', '月度销售报表', '各分公司月度销售数据汇总', '{}',
 '["org-001","org-002","org-003","org-004"]', datetime('now'), datetime('now')),

-- 表格5：上海分公司技术部专用 - 上海技术部创建，仅授权给自己
('table-005', 'tenant-001', 'user-009', '技术部巡检记录', '日常系统巡检记录表', '{}',
 '["org-008"]', datetime('now'), datetime('now')),

-- 表格6：运维部专用 - 深圳运维部创建，授权给自己和集团
('table-006', 'tenant-001', 'user-013', '运维工单统计', '运维工单月度统计表', '{}',
 '["org-001","org-011"]', datetime('now'), datetime('now'));

-- ============================================
-- 字段配置
-- ============================================

-- 员工信息表字段
INSERT INTO table_fields (id, tableId, name, type, required, config, "order", createdAt, updatedAt) VALUES
('field-001', 'table-001', '姓名', 'text', 1, '{}', 1, datetime('now'), datetime('now')),
('field-002', 'table-001', '工号', 'text', 1, '{}', 2, datetime('now'), datetime('now')),
('field-003', 'table-001', '所属组织', 'text', 1, '{}', 3, datetime('now'), datetime('now')),
('field-004', 'table-001', '职位', 'text', 1, '{}', 4, datetime('now'), datetime('now')),
('field-005', 'table-001', '入职日期', 'date', 1, '{}', 5, datetime('now'), datetime('now')),
('field-006', 'table-001', '邮箱', 'email', 1, '{}', 6, datetime('now'), datetime('now')),
('field-007', 'table-001', '手机号', 'phone', 0, '{}', 7, datetime('now'), datetime('now'));

-- 项目进度表字段
INSERT INTO table_fields (id, tableId, name, type, required, config, "order", createdAt, updatedAt) VALUES
('field-008', 'table-002', '项目名称', 'text', 1, '{}', 1, datetime('now'), datetime('now')),
('field-009', 'table-002', '负责人', 'text', 1, '{}', 2, datetime('now'), datetime('now')),
('field-010', 'table-002', '开始日期', 'date', 1, '{}', 3, datetime('now'), datetime('now')),
('field-011', 'table-002', '结束日期', 'date', 1, '{}', 4, datetime('now'), datetime('now')),
('field-012', 'table-002', '完成进度', 'number', 1, '{}', 5, datetime('now'), datetime('now')),
('field-013', 'table-002', '状态', 'select', 1, '{"options":["筹备中","进行中","已完成","已延期"]}', 6, datetime('now'), datetime('now'));

-- 设备清单字段
INSERT INTO table_fields (id, tableId, name, type, required, config, "order", createdAt, updatedAt) VALUES
('field-014', 'table-003', '设备名称', 'text', 1, '{}', 1, datetime('now'), datetime('now')),
('field-015', 'table-003', '设备编号', 'text', 1, '{}', 2, datetime('now'), datetime('now')),
('field-016', 'table-003', '购买日期', 'date', 0, '{}', 3, datetime('now'), datetime('now')),
('field-017', 'table-003', '使用部门', 'text', 1, '{}', 4, datetime('now'), datetime('now')),
('field-018', 'table-003', '设备状态', 'select', 1, '{"options":["正常使用","维修中","已报废"]}', 5, datetime('now'), datetime('now'));

-- 月度销售报表字段
INSERT INTO table_fields (id, tableId, name, type, required, config, "order", createdAt, updatedAt) VALUES
('field-019', 'table-004', '月份', 'date', 1, '{}', 1, datetime('now'), datetime('now')),
('field-020', 'table-004', '分公司', 'text', 1, '{}', 2, datetime('now'), datetime('now')),
('field-021', 'table-004', '销售额', 'number', 1, '{}', 3, datetime('now'), datetime('now')),
('field-022', 'table-004', '成本', 'number', 1, '{}', 4, datetime('now'), datetime('now')),
('field-023', 'table-004', '利润', 'number', 1, '{}', 5, datetime('now'), datetime('now')),
('field-024', 'table-004', '备注', 'text', 0, '{}', 6, datetime('now'), datetime('now'));

-- 技术部巡检记录字段
INSERT INTO table_fields (id, tableId, name, type, required, config, "order", createdAt, updatedAt) VALUES
('field-025', 'table-005', '巡检日期', 'date', 1, '{}', 1, datetime('now'), datetime('now')),
('field-026', 'table-005', '巡检人', 'text', 1, '{}', 2, datetime('now'), datetime('now')),
('field-027', 'table-005', '检查项', 'text', 1, '{}', 3, datetime('now'), datetime('now')),
('field-028', 'table-005', '检查结果', 'select', 1, '{"options":["正常","异常","待处理"]}', 4, datetime('now'), datetime('now')),
('field-029', 'table-005', '备注', 'text', 0, '{}', 5, datetime('now'), datetime('now'));

-- 运维工单统计字段
INSERT INTO table_fields (id, tableId, name, type, required, config, "order", createdAt, updatedAt) VALUES
('field-030', 'table-006', '工单编号', 'text', 1, '{}', 1, datetime('now'), datetime('now')),
('field-031', 'table-006', '提交日期', 'date', 1, '{}', 2, datetime('now'), datetime('now')),
('field-032', 'table-006', '问题类型', 'select', 1, '{"options":["服务器","网络","应用","其他"]}', 3, datetime('now'), datetime('now')),
('field-033', 'table-006', '处理人', 'text', 1, '{}', 4, datetime('now'), datetime('now')),
('field-034', 'table-006', '状态', 'select', 1, '{"options":["待处理","处理中","已解决"]}', 5, datetime('now'), datetime('now'));

-- ============================================
-- 动态数据（带 orgId，用于数据权限控制）
-- ============================================

-- 员工信息表数据（分布在不同组织）
INSERT INTO dynamic_data (id, tableId, orgId, rowData, createdAt, updatedAt) VALUES
('data-001', 'table-001', 'org-005', '{"姓名":"刘洋","工号":"EMP001","所属组织":"北京分公司-研发部","职位":"研发经理","入职日期":"2020-03-15","邮箱":"liuyang@bj.hxkj.com","手机号":"13800002001"}', datetime('now'), datetime('now')),
('data-002', 'table-001', 'org-006', '{"姓名":"孙丽","工号":"EMP002","所属组织":"北京分公司-市场部","职位":"市场经理","入职日期":"2019-08-20","邮箱":"sunli@bj.hxkj.com","手机号":"13800002002"}', datetime('now'), datetime('now')),
('data-003', 'table-001', 'org-008', '{"姓名":"吴杰","工号":"EMP003","所属组织":"上海分公司-技术部","职位":"技术经理","入职日期":"2018-01-10","邮箱":"wujie@sh.hxkj.com","手机号":"13800002003"}', datetime('now'), datetime('now')),
('data-004', 'table-001', 'org-009', '{"姓名":"郑娜","工号":"EMP004","所属组织":"上海分公司-销售部","职位":"销售经理","入职日期":"2021-06-01","邮箱":"zhengna@sh.hxkj.com","手机号":"13800002004"}', datetime('now'), datetime('now')),
('data-005', 'table-001', 'org-011', '{"姓名":"唐寅","工号":"EMP005","所属组织":"深圳分公司-运维部","职位":"运维经理","入职日期":"2020-11-25","邮箱":"tangyin@sz.hxkj.com","手机号":"13800002005"}', datetime('now'), datetime('now')),
('data-006', 'table-001', 'org-014', '{"姓名":"赵明","工号":"EMP006","所属组织":"北京分公司-研发部-前端组","职位":"前端组长","入职日期":"2021-02-15","邮箱":"zhaoming@bj.hxkj.com","手机号":"13800002006"}', datetime('now'), datetime('now')),
('data-007', 'table-001', 'org-015', '{"姓名":"钱晨","工号":"EMP007","所属组织":"北京分公司-研发部-后端组","职位":"后端组长","入职日期":"2021-04-20","邮箱":"qianchen@bj.hxkj.com","手机号":"13800002007"}', datetime('now'), datetime('now')),
('data-008', 'table-001', 'org-017', '{"姓名":"冯斌","工号":"EMP008","所属组织":"上海分公司-技术部-基础架构组","职位":"架构组长","入职日期":"2020-09-01","邮箱":"fengbin@sh.hxkj.com","手机号":"13800002008"}', datetime('now'), datetime('now'));

-- 项目进度表数据（北京分公司）
INSERT INTO dynamic_data (id, tableId, orgId, rowData, createdAt, updatedAt) VALUES
('data-009', 'table-002', 'org-002', '{"项目名称":"智慧社区平台","负责人":"刘洋","开始日期":"2024-01-01","结束日期":"2024-12-31","完成进度":65,"状态":"进行中"}', datetime('now'), datetime('now')),
('data-010', 'table-002', 'org-002', '{"项目名称":"企业内部系统升级","负责人":"赵明","开始日期":"2024-03-01","结束日期":"2024-06-30","完成进度":100,"状态":"已完成"}', datetime('now'), datetime('now')),
('data-011', 'table-002', 'org-002', '{"项目名称":"移动端APP开发","负责人":"钱晨","开始日期":"2024-02-15","结束日期":"2024-08-15","完成进度":40,"状态":"进行中"}', datetime('now'), datetime('now'));

-- 北京分公司设备清单数据
INSERT INTO dynamic_data (id, tableId, orgId, rowData, createdAt, updatedAt) VALUES
('data-012', 'table-003', 'org-005', '{"设备名称":"联想ThinkPad X1","设备编号":"PC-BJ-001","购买日期":"2023-05-10","使用部门":"研发部","设备状态":"正常使用"}', datetime('now'), datetime('now')),
('data-013', 'table-003', 'org-006', '{"设备名称":"Dell显示器U2720Q","设备编号":"MON-BJ-001","购买日期":"2023-03-15","使用部门":"市场部","设备状态":"正常使用"}', datetime('now'), datetime('now')),
('data-014', 'table-003', 'org-014', '{"设备名称":"MacBook Pro 16寸","设备编号":"PC-BJ-002","购买日期":"2024-01-20","使用部门":"前端组","设备状态":"正常使用"}', datetime('now'), datetime('now')),
('data-015', 'table-003', 'org-015', '{"设备名称":"iPhone 15测试机","设备编号":"PHONE-BJ-001","购买日期":"2024-02-01","使用部门":"后端组","设备状态":"正常使用"}', datetime('now'), datetime('now'));

-- 月度销售报表数据（各分公司）
INSERT INTO dynamic_data (id, tableId, orgId, rowData, createdAt, updatedAt) VALUES
-- 北京分公司销售数据
('data-016', 'table-004', 'org-002', '{"月份":"2024-01","分公司":"北京分公司","销售额":5200000,"成本":3200000,"利润":2000000,"备注":""}', datetime('now'), datetime('now')),
('data-017', 'table-004', 'org-002', '{"月份":"2024-02","分公司":"北京分公司","销售额":5800000,"成本":3500000,"利润":2300000,"备注":"春节假期影响"}', datetime('now'), datetime('now')),
('data-018', 'table-004', 'org-002', '{"月份":"2024-03","分公司":"北京分公司","销售额":6200000,"成本":3600000,"利润":2600000,"备注":""}', datetime('now'), datetime('now')),
-- 上海分公司销售数据
('data-019', 'table-004', 'org-003', '{"月份":"2024-01","分公司":"上海分公司","销售额":4800000,"成本":2900000,"利润":1900000,"备注":""}', datetime('now'), datetime('now')),
('data-020', 'table-004', 'org-003', '{"月份":"2024-02","分公司":"上海分公司","销售额":5100000,"成本":3000000,"利润":2100000,"备注":""}', datetime('now'), datetime('now')),
('data-021', 'table-004', 'org-003', '{"月份":"2024-03","分公司":"上海分公司","销售额":5500000,"成本":3100000,"利润":2400000,"备注":"业务扩展"}', datetime('now'), datetime('now')),
-- 深圳分公司销售数据
('data-022', 'table-004', 'org-004', '{"月份":"2024-01","分公司":"深圳分公司","销售额":5500000,"成本":3100000,"利润":2400000,"备注":""}', datetime('now'), datetime('now')),
('data-023', 'table-004', 'org-004', '{"月份":"2024-02","分公司":"深圳分公司","销售额":5900000,"成本":3300000,"利润":2600000,"备注":""}', datetime('now'), datetime('now')),
('data-024', 'table-004', 'org-004', '{"月份":"2024-03","分公司":"深圳分公司","销售额":6400000,"成本":3500000,"利润":2900000,"备注":"新产品上线"}', datetime('now'), datetime('now'));

-- 技术部巡检记录（上海技术部）
INSERT INTO dynamic_data (id, tableId, orgId, rowData, createdAt, updatedAt) VALUES
('data-025', 'table-005', 'org-008', '{"巡检日期":"2024-03-25","巡检人":"吴杰","检查项":"数据库服务器","检查结果":"正常","备注":"CPU使用率45%，内存使用率60%"}', datetime('now'), datetime('now')),
('data-026', 'table-005', 'org-017', '{"巡检日期":"2024-03-25","巡检人":"冯斌","检查项":"核心交换机","检查结果":"正常","备注":"所有端口运行正常"}', datetime('now'), datetime('now')),
('data-027', 'table-005', 'org-018', '{"巡检日期":"2024-03-26","巡检人":"吴杰","检查项":"应用服务器集群","检查结果":"待处理","备注":"其中一台服务器负载偏高"}', datetime('now'), datetime('now'));

-- 运维工单统计（深圳运维部）
INSERT INTO dynamic_data (id, tableId, orgId, rowData, createdAt, updatedAt) VALUES
('data-028', 'table-006', 'org-011', '{"工单编号":"WO-2024-001","提交日期":"2024-03-20","问题类型":"服务器","处理人":"唐寅","状态":"已解决"}', datetime('now'), datetime('now')),
('data-029', 'table-006', 'org-019', '{"工单编号":"WO-2024-002","提交日期":"2024-03-21","问题类型":"网络","处理人":"何立行","状态":"已解决"}', datetime('now'), datetime('now')),
('data-030', 'table-006', 'org-020', '{"工单编号":"WO-2024-003","提交日期":"2024-03-22","问题类型":"应用","处理人":"何立行","状态":"处理中"}', datetime('now'), datetime('now')),
('data-031', 'table-006', 'org-011', '{"工单编号":"WO-2024-004","提交日期":"2024-03-25","问题类型":"其他","处理人":"唐寅","状态":"待处理"}', datetime('now'), datetime('now'));

-- ============================================
-- 测试用户权限说明
-- ============================================
-- 所有用户密码都是: 123456 (MD5: e10adc3949ba59abbe56e057f20f883e)
--
-- 用户列表:
-- user-001 admin     集团总部 -> 超管，可访问所有表格和数据
-- user-002 zhaoyong  集团总部 -> 超管，可访问所有表格和数据
-- user-003 wangfeng  北京分公司 -> 可看员工表、销售表；可看北分、北分子部门的数据
-- user-004 liuyang   北京研发部 -> 可看员工表、销售表、设备表(创建者)；可看研发部数据
-- user-005 sunli     北京市场部 -> 可看员工表、销售表；可看市场部数据
-- user-006 zhaoming  北分研发部前端组 -> 可看员工表、销售表、设备表；可看前端组数据
-- user-007 qianchen  北分研发部后端组 -> 可看员工表、销售表、设备表；可看后端组数据
-- user-008 zhouhua   上海分公司 -> 可看员工表、销售表；可看上分、上分子部门数据
-- user-009 wujie     上海技术部 -> 可看员工表、销售表、技术部巡检表(创建者)；可看技术部数据
-- user-010 zhengna   上海销售部 -> 可看员工表、销售表；可看销售部数据
-- user-011 fengbin   上海技术部基础架构组 -> 可看员工表、销售表、技术部巡检表；可看基础架构组数据
-- user-012 lisong    深圳分公司 -> 可看员工表、销售表；可看深分、深分子部门数据
-- user-013 tangyin   深圳运维部 -> 可看员工表、销售表、运维工单表(创建者)；可看运维部数据
-- user-014 helixing  深圳运维部运维一组 -> 可看员工表、销售表、运维工单表；可看运维一组数据
