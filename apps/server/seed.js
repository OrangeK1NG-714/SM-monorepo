'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');

const MONGO_URL = 'mongodb://root:123456@127.0.0.1:27017/ms-da-projects?authSource=admin';

// ── helpers ──────────────────────────────────────────────
function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randGpa() {
  return (Math.random() * 1.5 + 2.5).toFixed(2); // 2.50 ~ 4.00
}

function randPhone() {
  const prefixes = ['138', '139', '150', '151', '186', '187', '188', '135', '136', '177'];
  return rand(prefixes) + String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
}

// ── Schemas (mirrors app/model/) ─────────────────────────
mongoose.pluralize(null);

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  role:     { type: String, required: true, enum: ['admin', 'student', 'teacher'], default: 'student' },
}, { versionKey: false });

const TeacherSchema = new mongoose.Schema({
  name:          { type: String, default: '' },
  teacherId:     { type: String, default: '' },
  msg:           { type: String, default: '' },
  teacherType:   { type: String, default: '' },
  allowedMajors: { type: [String], default: ['普通', '中本'] },
  resumeName:    { type: String, default: '' },
  resumePath:    { type: String, default: '' },
}, { versionKey: false });

const StudentSchema = new mongoose.Schema({
  data:      { type: Object, default: {} },
  studentId: { type: String, default: '' },
  mentor:    { type: String, default: '' },
  openid:    { type: String, default: '' },
}, { versionKey: false });

const User    = mongoose.model('User', UserSchema);
const Teacher = mongoose.model('Teacher', TeacherSchema);
const Student = mongoose.model('Student', StudentSchema);

// ── Test data pools ──────────────────────────────────────
const TEACHER_NAMES = [
  '张伟', '王芳', '李强', '赵敏', '刘洋', '陈静', '杨磊', '黄丽', '周军', '吴秀英',
  '徐浩', '孙丽华', '马超', '朱红', '胡建国', '郭晓明', '林峰', '何婷', '罗志强', '梁慧',
  '宋文博', '唐雪梅', '韩磊', '冯晓燕', '董明', '萧红', '程志伟', '曹丽', '邓超', '许静',
];

const TEACHER_TYPES = ['教授', '副教授', '讲师', '高级讲师', '助理教授'];

const TEACHER_MSGS = [
  '研究方向：人工智能与机器学习。欢迎对深度学习感兴趣的同学选择我！',
  '研究方向：软件工程与系统架构。希望同学具备扎实的编程基础。',
  '研究方向：数据库与大数据分析。欢迎有数据挖掘基础的同学。',
  '研究方向：计算机网络与信息安全。期待热爱网络安全的同学！',
  '研究方向：嵌入式系统与物联网。欢迎对硬件感兴趣的同学。',
  '研究方向：自然语言处理与知识图谱。NLP方向同学优先考虑。',
  '研究方向：计算机视觉与图像处理。需要一定数学功底。',
  '研究方向：前端工程化与用户体验。欢迎对前端技术有热情的同学。',
  '研究方向：云计算与分布式系统。希望同学了解Linux基础。',
  '研究方向：移动应用开发。欢迎有APP开发经验的同学！',
];

const STUDENT_SURNAMES = ['张', '王', '李', '赵', '陈', '刘', '杨', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '林', '何', '罗', '梁'];
const STUDENT_GIVEN_M  = ['伟', '强', '磊', '浩', '志远', '宇航', '子轩', '明', '建华', '俊杰'];
const STUDENT_GIVEN_F  = ['芳', '静', '婷', '雪', '丽', '敏', '慧', '晓燕', '秀英', '欣怡'];
const GENDERS     = ['男', '女'];
const GRADES      = ['2022级', '2023级', '2024级'];
const CLASS_NUMS  = ['1班', '2班', '3班', '4班', '5班', '6班'];
const DIRECTIONS  = ['软件开发', '网络工程', '数据科学', '人工智能', '信息安全', '嵌入式'];
const MAJORS      = ['普通', '中本'];

function genStudentName(gender) {
  const surname = rand(STUDENT_SURNAMES);
  const given = gender === '男' ? rand(STUDENT_GIVEN_M) : rand(STUDENT_GIVEN_F);
  return surname + given;
}

// ── Main seed function ───────────────────────────────────
async function seed() {
  await mongoose.connect(MONGO_URL);
  console.log('✅ Connected to MongoDB:', MONGO_URL);

  // Clear existing data
  await User.deleteMany({});
  await Teacher.deleteMany({});
  await Student.deleteMany({});
  console.log('🗑️  Cleared existing User / Teacher / Student collections');

  const defaultPassword = sha256('123456');

  // ── 1. Admin ───────────────────────────────────────────
  await User.create({ username: '000000', password: sha256('admin123'), role: 'admin' });
  console.log('👤 Created admin: 000000 / admin123');

  // ── 2. 30 Teachers ─────────────────────────────────────
  const teacherUsers = [];
  const teacherDocs  = [];

  for (let i = 1; i <= 30; i++) {
    const username = String(100000 + i); // 100001 ~ 100030
    const name = TEACHER_NAMES[i - 1];
    const teacherType = rand(TEACHER_TYPES);
    const msg = rand(TEACHER_MSGS);

    teacherUsers.push({ username, password: defaultPassword, role: 'teacher' });
    teacherDocs.push({
      name,
      teacherId: username,
      msg,
      teacherType,
      allowedMajors: ['普通', '中本'],
    });
  }

  await User.insertMany(teacherUsers);
  await Teacher.insertMany(teacherDocs);
  console.log(`🧑‍🏫 Created ${teacherUsers.length} teachers (100001 ~ 100030 / 123456)`);

  // ── 3. 100 Students ───────────────────────────────────
  const studentUsers = [];
  const studentDocs  = [];

  for (let i = 1; i <= 100; i++) {
    const username = String(200000 + i); // 200001 ~ 200100
    const gender = rand(GENDERS);
    const name = genStudentName(gender);
    const grade = rand(GRADES);
    const classNum = rand(CLASS_NUMS);
    const phone = randPhone();
    const gpa = randGpa();
    const direction = rand(DIRECTIONS);
    const major = rand(MAJORS);

    studentUsers.push({ username, password: defaultPassword, role: 'student' });
    studentDocs.push({
      studentId: username,
      mentor: '',
      data: {
        name,
        gender,
        studentId: username,
        grade,
        classNum,
        phone,
        gpa,
        direction,
        major,
      },
    });
  }

  await User.insertMany(studentUsers);
  await Student.insertMany(studentDocs);
  console.log(`🧑‍🎓 Created ${studentUsers.length} students (200001 ~ 200100 / 123456)`);

  // ── Summary ────────────────────────────────────────────
  const userCount    = await User.countDocuments();
  const teacherCount = await Teacher.countDocuments();
  const studentCount = await Student.countDocuments();

  console.log('\n📊 Database summary:');
  console.log(`   User:    ${userCount} (1 admin + 30 teachers + 100 students)`);
  console.log(`   Teacher: ${teacherCount}`);
  console.log(`   Student: ${studentCount}`);
  console.log('\n🎉 Seed complete!');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
