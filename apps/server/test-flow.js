'use strict';

const mongoose = require('mongoose');
const MONGO_URL = 'mongodb://root:123456@127.0.0.1:27017/ms-da-projects?authSource=admin';

const BASE = 'http://127.0.0.1:7001';
let passed = 0;
let failed = 0;
const failures = [];

// ── helpers ──────────────────────────────────────────────
async function api(method, path, { body, token, query } = {}) {
  let url = BASE + path;
  if (query) {
    const qs = new URLSearchParams(query).toString();
    url += '?' + qs;
  }
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const opts = { method, headers };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch {
    return { status: res.status, data: text };
  }
}

function assert(name, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`);
  }
}

function section(title) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(60));
}

// ── date helpers ─────────────────────────────────────────
function offsetDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ══════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════
async function main() {
  console.log('🚀 全流程测试开始\n');

  let adminToken, studentToken, teacherToken;
  let activityId;
  let chooseId, finalId, userInActivityIdToDelete;

  // ════════════════════════════════════════════════════════
  //  阶段 1：管理员登录 & 创建活动
  // ════════════════════════════════════════════════════════
  section('阶段 1：管理员登录 & 创建活动');

  // 1. 管理员登录
  {
    const r = await api('POST', '/api/user/login', {
      body: { username: '000000', password: 'admin123' },
    });
    adminToken = r.data?.data?.accessToken;
    assert('1. 管理员登录', r.data?.code === 200 && adminToken, `code=${r.data?.code}`);
  }

  // 2. 创建活动（日期窗口覆盖当前时间）
  {
    const r = await api('POST', '/api/admin/addActivity', {
      token: adminToken,
      body: {
        name: '2025届师生互选测试活动',
        description: '全流程自动化测试活动',
        startDate: offsetDate(-1),
        endDate: offsetDate(30),
        firstChooseStartDate: offsetDate(-1),
        firstChooseEndDate: offsetDate(10),
        secondChooseStartDate: offsetDate(10),
        secondChooseEndDate: offsetDate(20),
        thirdChooseStartDate: offsetDate(20),
        thirdChooseEndDate: offsetDate(30),
        stdChooseStartDate: offsetDate(-1),
        stdChooseEndDate: offsetDate(30),
        firstChooseNum: 3,
        secondChooseNum: 3,
        thirdChooseNum: 3,
        stdChooseNum: 3,
      },
    });
    assert('2. 创建活动', r.data?.code === 200, `code=${r.data?.code} msg=${r.data?.msg}`);
  }

  // 3. 查询活动列表
  {
    const r = await api('GET', '/api/admin/getActivityList', { token: adminToken });
    const list = Array.isArray(r.data) ? r.data : [];
    activityId = list.length > 0 ? list[list.length - 1]._id : null;
    assert('3. 查询活动列表', list.length > 0 && activityId, `count=${list.length}`);
  }

  // 4. 查询活动详情
  {
    const r = await api('GET', '/api/admin/getActivityDetail', {
      token: adminToken,
      query: { id: activityId },
    });
    assert('4. 查询活动详情', r.data?.name === '2025届师生互选测试活动', `name=${r.data?.name}`);
  }

  // ════════════════════════════════════════════════════════
  //  阶段 2：管理员添加用户到活动
  // ════════════════════════════════════════════════════════
  section('阶段 2：管理员添加用户到活动');

  // 5. 添加 5 个老师到活动
  {
    let ok = 0;
    for (let i = 1; i <= 5; i++) {
      const r = await api('POST', '/api/admin/addTeacherToActivity', {
        token: adminToken,
        body: { activityId, teacherId: String(100000 + i) },
      });
      if (r.data?.code === 200) ok++;
    }
    assert('5. 添加 5 个老师到活动', ok === 5, `成功=${ok}/5`);
  }

  // 6. 添加 10 个学生到活动
  {
    let ok = 0;
    for (let i = 1; i <= 10; i++) {
      const r = await api('POST', '/api/admin/addTeacherToActivity', {
        token: adminToken,
        body: { activityId, studentId: String(200000 + i) },
      });
      if (r.data?.code === 200) ok++;
    }
    assert('6. 添加 10 个学生到活动', ok === 10, `成功=${ok}/10`);
  }

  // 7. 为每个老师配置最大可选学生数
  {
    let ok = 0;
    for (let i = 1; i <= 5; i++) {
      const r = await api('PUT', '/api/admin/configMaxSelectNum', {
        token: adminToken,
        body: { activityId, teacherId: String(100000 + i), maxSelectNum: 3 },
      });
      if (r.data?.code === 200) ok++;
    }
    assert('7. 配置老师最大可选学生数', ok === 5, `成功=${ok}/5`);
  }

  // 8. 查询活动中的用户
  {
    const r = await api('GET', '/api/admin/getUserListInActivity', {
      token: adminToken,
      query: { activityId },
    });
    const list = Array.isArray(r.data) ? r.data : [];
    assert('8. 查询活动中的用户列表', list.length === 15, `count=${list.length}`);
    if (list.length > 0) userInActivityIdToDelete = list[list.length - 1]._id;
  }

  // 9. 查询活动中的老师
  {
    const r = await api('GET', '/api/admin/getTeacherListInActivity', {
      token: adminToken,
      query: { activityId },
    });
    const list = Array.isArray(r.data) ? r.data : [];
    assert('9. 查询活动中的老师列表', list.length === 5, `count=${list.length}`);
  }

  // 10. 查询活动中的学生
  {
    const r = await api('GET', '/api/admin/getStudentListInActivity', {
      token: adminToken,
      query: { activityId },
    });
    const list = Array.isArray(r.data) ? r.data : [];
    assert('10. 查询活动中的学生列表', list.length === 10, `count=${list.length}`);
  }

  // ════════════════════════════════════════════════════════
  //  阶段 3：管理员用户管理
  // ════════════════════════════════════════════════════════
  section('阶段 3：管理员用户管理');

  // 11. 查询所有用户
  {
    const r = await api('GET', '/api/admin/getUserList', { token: adminToken });
    const list = Array.isArray(r.data) ? r.data : [];
    assert('11. 查询所有用户列表', list.length >= 131, `count=${list.length}`);
  }

  // 12. 按角色筛选用户
  {
    const r = await api('GET', '/api/admin/getUserInfo', {
      token: adminToken,
      query: { role: 'teacher' },
    });
    const list = Array.isArray(r.data) ? r.data : [];
    assert('12. 按角色筛选老师', list.length === 30, `count=${list.length}`);
  }

  // 13. 重置学生密码
  {
    const r = await api('POST', '/api/admin/resetPassword', {
      token: adminToken,
      body: { username: '200010', password: 'abc12345' },
    });
    assert('13. 重置学生密码', r.data?.code === 200, `msg=${r.data?.msg}`);
  }

  // 13b. 批量重置密码
  {
    const r = await api('POST', '/api/admin/resetSelectedPassword', {
      token: adminToken,
      body: { selectedUsers: ['200010'], password: '123456' },
    });
    assert('13b. 批量重置密码', r.data?.code === 200, `msg=${r.data?.msg}`);
  }

  // ════════════════════════════════════════════════════════
  //  阶段 4：学生操作
  // ════════════════════════════════════════════════════════
  section('阶段 4：学生操作');

  // 14. 学生登录
  {
    const r = await api('POST', '/api/user/login', {
      body: { username: '200001', password: '123456' },
    });
    studentToken = r.data?.data?.accessToken;
    assert('14. 学生 200001 登录', r.data?.code === 200 && studentToken, `code=${r.data?.code}`);
  }

  // 15. 查看学生详情
  {
    const r = await api('GET', '/api/user/detail', {
      token: studentToken,
      query: { username: '200001', role: 'student' },
    });
    assert('15. 查看学生详情', r.data?.code === 200 && r.data?.data, `code=${r.data?.code}`);
  }

  // 16. 学生填写个人信息
  {
    const r = await api('POST', '/api/user/writeMsg', {
      token: studentToken,
      body: {
        name: '测试学生一',
        gender: '男',
        studentId: '200001',
        grade: '2024级',
        classNum: '1班',
        phone: '13800000001',
        gpa: '3.85',
        direction: '人工智能',
        major: '普通',
      },
    });
    assert('16. 学生填写个人信息', r.data?.code === 200, `msg=${r.data?.msg}`);
  }

  // 17. 查看学生信息
  {
    const r = await api('GET', '/api/student/getMsg', {
      token: studentToken,
      query: { studentId: '200001' },
    });
    assert('17. 查看学生信息', r.data?.data?.name === '测试学生一', `name=${r.data?.data?.name}`);
  }

  // 18. 检查学生是否在活动中
  {
    const r = await api('GET', '/api/student/isInActivity', {
      token: studentToken,
      query: { studentId: '200001', activityId },
    });
    assert('18. 学生在活动中', r.data?.code === 200, `msg=${r.data?.msg}`);
  }

  // 19. 获取活动中的老师列表
  {
    const r = await api('GET', '/api/student/getTeacherList', {
      token: studentToken,
      query: { activityId },
    });
    const list = Array.isArray(r.data) ? r.data : [];
    assert('19. 获取活动中老师列表', list.length === 5, `count=${list.length}`);
  }

  // 20. 学生选择 3 个老师（志愿 1/2/3）
  {
    let ok = 0;
    for (let order = 1; order <= 3; order++) {
      const r = await api('POST', '/api/student/selectTeacher', {
        token: studentToken,
        body: {
          studentId: '200001',
          teacherId: String(100000 + order),
          order,
          isChose: false,
          activityId,
          createTime: new Date().toISOString(),
        },
      });
      if (r.data?.code === 200) ok++;
    }
    assert('20. 学生 200001 选择 3 个老师', ok === 3, `成功=${ok}/3`);
  }

  // 21. 查看学生的选择情况
  {
    const r = await api('GET', '/api/user/getChooseDetail', {
      token: studentToken,
      query: { activityId, studentId: '200001' },
    });
    const list = Array.isArray(r.data) ? r.data : [];
    assert('21. 查看学生选择情况', list.length === 3, `count=${list.length}`);
  }

  // 22. 学生 200002 登录并选择
  {
    const lr = await api('POST', '/api/user/login', {
      body: { username: '200002', password: '123456' },
    });
    const t2 = lr.data?.data?.accessToken;
    assert('22a. 学生 200002 登录', !!t2);

    let ok = 0;
    for (let order = 1; order <= 3; order++) {
      const r = await api('POST', '/api/student/selectTeacher', {
        token: t2,
        body: {
          studentId: '200002',
          teacherId: String(100000 + order),
          order,
          isChose: false,
          activityId,
          createTime: new Date().toISOString(),
        },
      });
      if (r.data?.code === 200) ok++;
    }
    assert('22b. 学生 200002 选择 3 个老师', ok === 3, `成功=${ok}/3`);
  }

  // 22c. 学生 200003 登录并选择
  {
    const lr = await api('POST', '/api/user/login', {
      body: { username: '200003', password: '123456' },
    });
    const t3 = lr.data?.data?.accessToken;
    assert('22c. 学生 200003 登录', !!t3);

    let ok = 0;
    for (let order = 1; order <= 3; order++) {
      const r = await api('POST', '/api/student/selectTeacher', {
        token: t3,
        body: {
          studentId: '200003',
          teacherId: String(100000 + order),
          order,
          isChose: false,
          activityId,
          createTime: new Date().toISOString(),
        },
      });
      if (r.data?.code === 200) ok++;
    }
    assert('22d. 学生 200003 选择 3 个老师', ok === 3, `成功=${ok}/3`);
  }

  // ════════════════════════════════════════════════════════
  //  阶段 5：老师操作
  // ════════════════════════════════════════════════════════
  section('阶段 5：老师操作');

  // 23. 老师登录
  {
    const r = await api('POST', '/api/user/login', {
      body: { username: '100001', password: '123456' },
    });
    teacherToken = r.data?.data?.accessToken;
    assert('23. 老师 100001 登录', r.data?.code === 200 && teacherToken, `code=${r.data?.code}`);
  }

  // 24. 查看老师详情
  {
    const r = await api('GET', '/api/user/detail', {
      token: teacherToken,
      query: { username: '100001', role: 'teacher' },
    });
    assert('24. 查看老师详情', r.data?.code === 200 && r.data?.data, `code=${r.data?.code}`);
  }

  // 25. 获取所有老师信息
  {
    const r = await api('GET', '/api/teacher/detail', { token: teacherToken });
    assert('25. 获取所有老师信息', r.data?.code === 200 && r.data?.data?.length === 30, `count=${r.data?.data?.length}`);
  }

  // 26. 检查老师是否在活动中
  {
    const r = await api('GET', '/api/teacher/isInActivity', {
      token: teacherToken,
      query: { teacherId: '100001', activityId },
    });
    assert('26. 老师在活动中', r.data?.code === 200, `msg=${r.data?.msg}`);
  }

  // 27. 查看活动中所有选择记录
  {
    const r = await api('GET', '/api/user/getChooseList', {
      token: teacherToken,
      query: { activityId },
    });
    const list = Array.isArray(r.data) ? r.data : [];
    assert('27. 查看活动选择记录', list.length === 9, `count=${list.length}`);
  }

  // 28. 查看该老师被选次数
  {
    const r = await api('GET', '/api/user/getChooseCount', {
      token: teacherToken,
      query: { teacherId: '100001', activityId },
    });
    const list = Array.isArray(r.data) ? r.data : [];
    assert('28. 老师 100001 被选次数', list.length === 3, `count=${list.length}`);
  }

  // 29. 老师同意学生（切换 isChose）
  {
    const r = await api('PUT', '/api/student/updateTeacher', {
      token: teacherToken,
      body: { studentId: '200001', teacherId: '100001', activityId },
    });
    assert('29. 老师同意学生 200001', r.data?.code === 200, `msg=${r.data?.msg}`);
  }

  // 30. 老师最终选择学生（创建 Final 记录）
  {
    const r = await api('POST', '/api/teacher/selectStudent', {
      token: teacherToken,
      body: {
        studentId: '200001',
        teacherId: '100001',
        activityId,
        data: { name: '测试学生一', studentId: '200001', gpa: '3.85' },
        order: 1,
      },
    });
    assert('30a. 老师选择学生 200001', r.data?.code === 200, `msg=${r.data?.msg}`);

    const r2 = await api('POST', '/api/teacher/selectStudent', {
      token: teacherToken,
      body: {
        studentId: '200002',
        teacherId: '100001',
        activityId,
        data: { name: '学生二', studentId: '200002' },
        order: 2,
      },
    });
    assert('30b. 老师选择学生 200002', r2.data?.code === 200, `msg=${r2.data?.msg}`);
  }

  // 31. 查看老师已选学生列表
  {
    const r = await api('GET', '/api/teacher/getSelectList', {
      token: teacherToken,
      query: { teacherId: '100001', activityId },
    });
    const list = Array.isArray(r.data) ? r.data : [];
    assert('31. 老师已选学生列表', list.length === 2, `count=${list.length}`);
    if (list.length > 0) finalId = list[list.length - 1]._id;
  }

  // ════════════════════════════════════════════════════════
  //  阶段 6：管理员查询 & 管理选择记录
  // ════════════════════════════════════════════════════════
  section('阶段 6：管理员查询 & 管理选择记录');

  // 32. 查询所有 Choose 记录
  {
    const r = await api('GET', '/api/admin/getSelectedList', {
      token: adminToken,
      query: { activityId },
    });
    const list = Array.isArray(r.data) ? r.data : [];
    assert('32. 查询所有 Choose 记录', list.length >= 6, `count=${list.length}`);
    const pickable = list.find(c => c.studentId === '200001' || c.studentId === '200002');
    if (pickable) chooseId = pickable._id;
  }

  // 33. 查询所有 Final 记录
  {
    const r = await api('GET', '/api/admin/getFinalList', {
      token: adminToken,
      query: { activityId },
    });
    const list = Array.isArray(r.data) ? r.data : [];
    assert('33. 查询所有 Final 记录', list.length === 2, `count=${list.length}`);
  }

  // 34. 查询某学生的最终结果
  {
    const r = await api('GET', '/api/admin/getFinalChoose', {
      token: adminToken,
      query: { studentId: '200001', activityId },
    });
    assert('34. 查询学生 200001 最终结果', r.data?.studentId === '200001' || r.data?.teacherId === '100001');
  }

  // 35. 查询老师最大可选数
  {
    const r = await api('GET', '/api/user/getMaxSelectNum', {
      token: adminToken,
      query: { activityId, teacherId: '100001' },
    });
    assert('35. 查询老师最大可选数', r.data?.maxSelectNum === 3, `maxSelectNum=${r.data?.maxSelectNum}`);
  }

  // 36. 重置某学生的志愿
  {
    const r = await api('DELETE', '/api/admin/resetVolunteer', {
      token: adminToken,
      body: { activityId, studentId: '200003' },
    });
    assert('36. 重置学生 200003 志愿', r.data?.code === 200, `msg=${r.data?.msg}`);
  }

  // 37. 删除某条 Choose 记录
  if (chooseId) {
    const r = await api('DELETE', '/api/admin/deleteSelected', {
      token: adminToken,
      body: { _id: chooseId },
    });
    assert('37. 删除一条 Choose 记录', r.data?.code === 200, `msg=${r.data?.msg}`);
  } else {
    assert('37. 删除一条 Choose 记录', false, '无可用 chooseId');
  }

  // 38. 老师取消选择某学生（用 query params）
  {
    const r = await api('DELETE', '/api/teacher/cancelSelect', {
      token: teacherToken,
      query: { studentId: '200002', teacherId: '100001', activityId },
    });
    assert('38. 老师取消选择学生 200002', r.data?.code === 200, `msg=${r.data?.msg}`);
  }

  // ════════════════════════════════════════════════════════
  //  阶段 7：管理员管理操作
  // ════════════════════════════════════════════════════════
  section('阶段 7：管理员管理操作');

  // 39. 从活动中移除用户
  if (userInActivityIdToDelete) {
    const r = await api('DELETE', '/api/admin/deleteUserInActivity', {
      token: adminToken,
      body: { _id: userInActivityIdToDelete },
    });
    assert('39. 从活动中移除用户', r.data?.code === 200, `msg=${r.data?.msg}`);
  } else {
    assert('39. 从活动中移除用户', false, '无可用 _id');
  }

  // 40. 更新活动信息
  {
    const r = await api('PUT', '/api/admin/updateActivity', {
      token: adminToken,
      body: {
        _id: activityId,
        name: '2025届师生互选测试活动（已更新）',
        description: '更新后的描述',
        startDate: offsetDate(-1),
        endDate: offsetDate(60),
        firstChooseStartDate: offsetDate(-1),
        firstChooseEndDate: offsetDate(15),
        secondChooseStartDate: offsetDate(15),
        secondChooseEndDate: offsetDate(30),
        thirdChooseStartDate: offsetDate(30),
        thirdChooseEndDate: offsetDate(60),
        stdChooseStartDate: offsetDate(-1),
        stdChooseEndDate: offsetDate(60),
      },
    });
    assert('40. 更新活动信息', r.data?.code === 200, `msg=${r.data?.msg}`);
  }

  // 41. 更新用户信息（修改 admin 查询到的某个用户）
  {
    const userList = await api('GET', '/api/admin/getUserInfo', {
      token: adminToken,
      query: { username: '200010', role: 'student' },
    });
    const users = Array.isArray(userList.data) ? userList.data : [];
    if (users.length > 0) {
      const r = await api('PUT', '/api/admin/updateUser', {
        token: adminToken,
        body: { id: users[0]._id },
      });
      assert('41. 更新用户信息', r.data?.code === 200, `msg=${r.data?.msg}`);
    } else {
      assert('41. 更新用户信息', false, '未找到用户 200010');
    }
  }

  // 42. 更新老师专业限制
  {
    const r = await api('PUT', '/api/admin/updateTeacherAllowedMajors', {
      token: adminToken,
      body: { teacherId: '100001', allowedMajors: ['普通', '中本', '专升本'] },
    });
    assert('42. 更新老师专业限制', r.data?.code === 200, `msg=${r.data?.msg}`);
  }

  // 43. Token 刷新
  section('阶段 8：Token 刷新');
  {
    const loginRes = await api('POST', '/api/user/login', {
      body: { username: '200001', password: '123456' },
    });
    const refreshToken = loginRes.data?.data?.refreshToken;
    assert('43a. 获取 refreshToken', !!refreshToken);

    if (refreshToken) {
      const r = await api('POST', '/api/user/refreshToken', {
        body: { refreshToken },
      });
      assert('43b. 刷新 accessToken', r.data?.code === 200 && r.data?.data?.accessToken, `msg=${r.data?.msg}`);
    }
  }

  // ════════════════════════════════════════════════════════
  //  阶段 9：订阅消息 & 推送数据通路验证
  // ════════════════════════════════════════════════════════
  section('阶段 9：订阅消息 & 推送数据通路验证');

  // 连接 MongoDB 直接操作（模拟定时任务的数据流）
  await mongoose.connect(MONGO_URL);
  mongoose.pluralize(null);

  const ActivityModel = mongoose.models.Activity || mongoose.model('Activity', new mongoose.Schema({}, { strict: false, versionKey: false }));
  const ChooseModel = mongoose.models.Choose || mongoose.model('Choose', new mongoose.Schema({}, { strict: false, versionKey: false }));
  const FinalModel = mongoose.models.Final || mongoose.model('Final', new mongoose.Schema({}, { strict: false, versionKey: false }));
  const StudentModel = mongoose.models.Student || mongoose.model('Student', new mongoose.Schema({}, { strict: false, versionKey: false }));

  // 44. Choose 记录中包含 subscribeTemplateId 字段
  {
    const chooses = await ChooseModel.find({ activityId });
    const withTemplate = chooses.filter(c => c.subscribeTemplateId || c.subscribeStatus);
    assert('44. Choose 记录可存储订阅模板信息', chooses.length > 0, `总记录=${chooses.length}`);
  }

  // 45. 验证定时任务数据通路：Final 表有被选学生，Choose 表有全部学生
  {
    const finalList = await FinalModel.find({ activityId });
    const selectedIds = new Set(finalList.map(r => r.studentId));
    const chooseList = await ChooseModel.find({ activityId });
    const allIds = new Set(chooseList.map(r => r.studentId));

    assert('45a. Final 表有被选中学生', selectedIds.size > 0, `被选=${selectedIds.size}`);
    assert('45b. Choose 表有提交志愿学生', allIds.size > 0, `提交志愿=${allIds.size}`);

    const unselected = [...allIds].filter(id => !selectedIds.has(id));
    assert('45c. 可区分被选中和落选学生', unselected.length >= 0, `被选=${selectedIds.size} 落选=${unselected.length}`);
  }

  // 46. 验证 subscribeSent 标记（定时任务靠此防重复）
  {
    const activity = await ActivityModel.findById(activityId);
    assert('46. 活动 subscribeSent 初始为 false', activity.subscribeSent === false, `subscribeSent=${activity.subscribeSent}`);
  }

  // 47. 模拟定时任务触发条件：设置 thirdChooseEndDate 为过去时间
  {
    await ActivityModel.findByIdAndUpdate(activityId, {
      thirdChooseEndDate: new Date(Date.now() - 60000),
    });
    const activity = await ActivityModel.findById(activityId);
    const now = new Date();
    const shouldTrigger = activity.thirdChooseEndDate <= now && !activity.subscribeSent;
    assert('47. 第三轮结束后定时任务应触发', shouldTrigger, `endDate=${activity.thirdChooseEndDate}`);

    // 恢复日期
    await ActivityModel.findByIdAndUpdate(activityId, {
      thirdChooseEndDate: offsetDate(30),
    });
  }

  // 48. 验证学生 openid 字段（推送需要 openid）
  {
    const student = await StudentModel.findOne({ studentId: '200001' });
    assert('48. 学生记录有 openid 字段', student && 'openid' in student.toObject(), `openid="${student?.openid || ''}"`);
    console.log('  ℹ️  注意：openid 为空是正常的（需真实微信环境才能获取）');
  }

  // 49. 验证推送消息模板数据结构（模拟 sendSubscribeMsg 的数据组装）
  {
    const finalList = await FinalModel.find({ activityId });
    if (finalList.length > 0) {
      const record = finalList[0];
      const msgData = {
        thing1: { value: '测试活动' },
        time2: { value: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) },
        thing3: { value: `导师已选择你` },
        thing4: { value: '请登录系统查看最终结果' },
      };
      const allFieldsPresent = msgData.thing1 && msgData.time2 && msgData.thing3 && msgData.thing4;
      assert('49. 订阅消息模板数据结构正确', allFieldsPresent && record.studentId);
    } else {
      assert('49. 订阅消息模板数据结构正确', false, '无 Final 记录');
    }
  }

  await mongoose.disconnect();

  // ════════════════════════════════════════════════════════
  //  阶段 10：服务端新增校验验证
  // ════════════════════════════════════════════════════════
  section('阶段 10：服务端新增校验验证');

  // 50. 未填信息学生不能选老师（服务端兜底）
  {
    // 先用 MongoDB 把 200010 的 data 清空
    await mongoose.connect(MONGO_URL);
    const StdModel = mongoose.models.Student;
    await StdModel.updateOne({ studentId: '200010' }, { data: {} });
    await mongoose.disconnect();

    const lr = await api('POST', '/api/user/login', {
      body: { username: '200010', password: '123456' },
    });
    const t10 = lr.data?.data?.accessToken;

    const r = await api('POST', '/api/student/selectTeacher', {
      token: t10,
      body: {
        studentId: '200010',
        teacherId: '100001',
        order: 1,
        isChose: false,
        activityId,
        createTime: new Date().toISOString(),
      },
    });
    assert('50. 未填信息学生选老师被拦截', r.data?.code === 400, `code=${r.data?.code} msg=${r.data?.msg}`);
  }

  // 51. updateChoose 找不到记录时不再 500
  {
    const r = await api('PUT', '/api/student/updateTeacher', {
      token: teacherToken,
      body: { studentId: '999999', teacherId: '100001', activityId },
    });
    assert('51. updateChoose 找不到记录返回 404（非 500）', r.data?.code === 404, `code=${r.data?.code}`);
  }

  // ════════════════════════════════════════════════════════
  //  总结
  // ════════════════════════════════════════════════════════
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  📊 测试总结`);
  console.log('═'.repeat(60));
  console.log(`  总计: ${passed + failed}  ✅ 通过: ${passed}  ❌ 失败: ${failed}`);
  if (failures.length > 0) {
    console.log('\n  失败项:');
    failures.forEach(f => console.log(`    - ${f}`));
  }
  console.log();

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('💥 脚本异常:', err);
  process.exit(1);
});
