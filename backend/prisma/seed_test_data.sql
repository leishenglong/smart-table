-- 插入测试租户
INSERT INTO tenants (id, name, code, description, createdAt, updatedAt) VALUES
('tenant-001', '示例集团', 'demo', '测试用租户', datetime('now'), datetime('now'));

-- 插入组织架构（3级：集团 -> 公司 -> 部门）
-- 集团
INSERT INTO organizations (id, tenantId, parentId, name, code, type, sort, createdAt, updatedAt) VALUES
('org-001', 'tenant-001', NULL, '华新科技集团', 'HQ', 'group', 1, datetime('now'), datetime('now'));

-- 公司
INSERT INTO organizations (id, tenantId, parentId, name, code, type, sort, createdAt, updatedAt) VALUES
('org-002', 'tenant-001', 'org-001', '北京分公司', 'BJ', 'company', 1, datetime('now'), datetime('now')),
('org-003', 'tenant-001', 'org-001', '上海分公司', 'SH', 'company', 2, datetime('now'), datetime('now')),
('org-004', 'tenant-001', 'org-001', '深圳分公司', 'SZ', 'company', 3, datetime('now'), datetime('now'));

-- 部门
INSERT INTO organizations (id, tenantId, parentId, name, code, type, sort, createdAt, updatedAt) VALUES
('org-005', 'tenant-001', 'org-002', '研发部', 'BJ-RD', 'department', 1, datetime('now'), datetime('now')),
('org-006', 'tenant-001', 'org-002', '市场部', 'BJ-MK', 'department', 2, datetime('now'), datetime('now')),
('org-007', 'tenant-001', 'org-003', '技术部', 'SH-TC', 'department', 1, datetime('now'), datetime('now')),
('org-008', 'tenant-001', 'org-003', '销售部', 'SH-SALES', 'department', 2, datetime('now'), datetime('now')),
('org-009', 'tenant-001', 'org-004', '运维部', 'SZ-OPS', 'department', 1, datetime('now'), datetime('now')),
('org-010', 'tenant-001', 'org-004', '财务部', 'SZ-FIN', 'department', 2, datetime('now'), datetime('now'));

-- 插入用户（密码都是123456的MD5）
INSERT INTO users (id, tenantId, orgId, username, password, name, phone, email, status, createdAt, updatedAt) VALUES
('user-001', 'tenant-001', 'org-001', 'admin', 'e10adc3949ba59abbe56e057f20f883e', '系统管理员', '13800000001', 'admin@example.com', 1, datetime('now'), datetime('now')),
('user-002', 'tenant-001', 'org-002', 'zhangsan', 'e10adc3949ba59abbe56e057f20f883e', '张三', '13800000002', 'zhangsan@example.com', 1, datetime('now'), datetime('now')),
('user-003', 'tenant-001', 'org-003', 'lisi', 'e10adc3949ba59abbe56e057f20f883e', '李四', '13800000003', 'lisi@example.com', 1, datetime('now'), datetime('now')),
('user-004', 'tenant-001', 'org-004', 'wangwu', 'e10adc3949ba59abbe56e057f20f883e', '王五', '13800000004', 'wangwu@example.com', 1, datetime('now'), datetime('now')),
('user-005', 'tenant-001', 'org-005', 'zhaoliu', 'e10adc3949ba59abbe56e057f20f883e', '赵六', '13800000005', 'zhaoliu@example.com', 1, datetime('now'), datetime('now')),
('user-006', 'tenant-001', 'org-006', 'sunqi', 'e10adc3949ba59abbe56e057f20f883e', '孙七', '13800000006', 'sunqi@example.com', 1, datetime('now'), datetime('now')),
('user-007', 'tenant-001', 'org-007', 'zhouba', 'e10adc3949ba59abbe56e057f20f883e', '周八', '13800000007', 'zhouba@example.com', 1, datetime('now'), datetime('now')),
('user-008', 'tenant-001', 'org-008', 'wujiu', 'e10adc3949ba59abbe56e057f20f883e', '吴九', '13800000008', 'wujiu@example.com', 1, datetime('now'), datetime('now')),
('user-009', 'tenant-001', 'org-009', 'zhengshi', 'e10adc3949ba59abbe56e057f20f883e', '郑十', '13800000009', 'zhengshi@example.com', 1, datetime('now'), datetime('now')),
('user-010', 'tenant-001', 'org-010', 'chenyun', 'e10adc3949ba59abbe56e057f20f883e', '陈云', '13800000010', 'chenyun@example.com', 1, datetime('now'), datetime('now'));

-- 插入表格配置
INSERT INTO table_configs (id, tenantId, name, description, config, createdAt, updatedAt) VALUES
('table-001', 'tenant-001', '员工信息表', '记录公司员工基本信息', '{}', datetime('now'), datetime('now')),
('table-002', 'tenant-001', '项目进度表', '跟踪各项目完成情况', '{}', datetime('now'), datetime('now')),
('table-003', 'tenant-001', '设备清单', '公司固定资产登记表', '{}', datetime('now'), datetime('now')),
('table-004', 'tenant-001', '月度销售报表', '各分公司月度销售数据', '{}', datetime('now'), datetime('now'));

-- 插入字段配置
-- 员工信息表字段
INSERT INTO table_fields (id, tableId, name, type, required, config, "order", createdAt, updatedAt) VALUES
('field-001', 'table-001', '姓名', 'text', 1, '{}', 1, datetime('now'), datetime('now')),
('field-002', 'table-001', '工号', 'text', 1, '{}', 2, datetime('now'), datetime('now')),
('field-003', 'table-001', '部门', 'text', 1, '{}', 3, datetime('now'), datetime('now')),
('field-004', 'table-001', '职位', 'text', 0, '{}', 4, datetime('now'), datetime('now')),
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

-- 插入动态数据
-- 员工信息表数据
INSERT INTO dynamic_data (id, tableId, rowData, createdAt, updatedAt) VALUES
('data-001', 'table-001', '{"姓名":"张三","工号":"EMP001","部门":"研发部","职位":"高级工程师","入职日期":"2022-03-15","邮箱":"zhangsan@example.com","手机号":"13800002001"}', datetime('now'), datetime('now')),
('data-002', 'table-001', '{"姓名":"李四","工号":"EMP002","部门":"市场部","职位":"市场经理","入职日期":"2021-08-20","邮箱":"lisi@example.com","手机号":"13800002002"}', datetime('now'), datetime('now')),
('data-003', 'table-001', '{"姓名":"王五","工号":"EMP003","部门":"技术部","职位":"技术总监","入职日期":"2020-01-10","邮箱":"wangwu@example.com","手机号":"13800002003"}', datetime('now'), datetime('now')),
('data-004', 'table-001', '{"姓名":"赵六","工号":"EMP004","部门":"销售部","职位":"销售代表","入职日期":"2023-06-01","邮箱":"zhaoliu@example.com","手机号":"13800002004"}', datetime('now'), datetime('now')),
('data-005', 'table-001', '{"姓名":"孙七","工号":"EMP005","部门":"运维部","职位":"运维工程师","入职日期":"2022-11-25","邮箱":"sunqi@example.com","手机号":"13800002005"}', datetime('now'), datetime('now'));

-- 项目进度表数据
INSERT INTO dynamic_data (id, tableId, rowData, createdAt, updatedAt) VALUES
('data-006', 'table-002', '{"项目名称":"智慧社区平台","负责人":"王五","开始日期":"2024-01-01","结束日期":"2024-12-31","完成进度":65,"状态":"进行中"}', datetime('now'), datetime('now')),
('data-007', 'table-002', '{"项目名称":"企业内部系统升级","负责人":"张三","开始日期":"2024-03-01","结束日期":"2024-06-30","完成进度":100,"状态":"已完成"}', datetime('now'), datetime('now')),
('data-008', 'table-002', '{"项目名称":"移动端APP开发","负责人":"李四","开始日期":"2024-02-15","结束日期":"2024-08-15","完成进度":40,"状态":"进行中"}', datetime('now'), datetime('now')),
('data-009', 'table-002', '{"项目名称":"数据中心迁移","负责人":"赵六","开始日期":"2024-06-01","结束日期":"2024-09-30","完成进度":10,"状态":"已延期"}', datetime('now'), datetime('now'));

-- 设备清单数据
INSERT INTO dynamic_data (id, tableId, rowData, createdAt, updatedAt) VALUES
('data-010', 'table-003', '{"设备名称":"联想ThinkPad X1","设备编号":"PC-001","购买日期":"2023-05-10","使用部门":"研发部","设备状态":"正常使用"}', datetime('now'), datetime('now')),
('data-011', 'table-003', '{"设备名称":"Dell服务器R740","设备编号":"SRV-001","购买日期":"2022-01-20","使用部门":"运维部","设备状态":"正常使用"}', datetime('now'), datetime('now')),
('data-012', 'table-003', '{"设备名称":"HP打印机LaserJet","设备编号":"PRN-001","购买日期":"2021-11-15","使用部门":"市场部","设备状态":"维修中"}', datetime('now'), datetime('now')),
('data-013', 'table-003', '{"设备名称":"Cisco网络交换机","设备编号":"NET-001","购买日期":"2020-06-01","使用部门":"运维部","设备状态":"正常使用"}', datetime('now'), datetime('now'));

-- 月度销售报表数据
INSERT INTO dynamic_data (id, tableId, rowData, createdAt, updatedAt) VALUES
('data-014', 'table-004', '{"月份":"2024-01","分公司":"北京分公司","销售额":5200000,"成本":3200000,"利润":2000000,"备注":""}', datetime('now'), datetime('now')),
('data-015', 'table-004', '{"月份":"2024-01","分公司":"上海分公司","销售额":4800000,"成本":2900000,"利润":1900000,"备注":""}', datetime('now'), datetime('now')),
('data-016', 'table-004', '{"月份":"2024-01","分公司":"深圳分公司","销售额":5500000,"成本":3100000,"利润":2400000,"备注":""}', datetime('now'), datetime('now')),
('data-017', 'table-004', '{"月份":"2024-02","分公司":"北京分公司","销售额":5800000,"成本":3500000,"利润":2300000,"备注":"春节假期影响"}', datetime('now'), datetime('now')),
('data-018', 'table-004', '{"月份":"2024-02","分公司":"上海分公司","销售额":5100000,"成本":3000000,"利润":2100000,"备注":""}', datetime('now'), datetime('now'));
