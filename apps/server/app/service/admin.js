'use strict';

const Service = require('egg').Service;
const crypto = require('crypto')

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class AdminService extends Service {
    async addActivity(name, description, startDate, endDate, firstChooseStartDate, firstChooseEndDate, secondChooseStartDate, secondChooseEndDate, thirdChooseStartDate, thirdChooseEndDate, stdChooseStartDate, stdChooseEndDate, firstChooseCount, secondChooseCount, thirdChooseCount, stdChooseCount) {
        const { ctx } = this;
        try {
            const res = await ctx.model.Activity.create({ name, description, startDate, endDate, firstChooseStartDate, firstChooseEndDate, secondChooseStartDate, secondChooseEndDate, thirdChooseStartDate, thirdChooseEndDate, stdChooseStartDate, stdChooseEndDate, firstChooseCount, secondChooseCount, thirdChooseCount, stdChooseCount });
            return { code: 200, msg: '活动创建成功', data: res };
        } catch (error) {
            ctx.logger.error('创建活动失败:', error);
            return { code: 500, msg: '创建活动失败' };
        }
    }
    async getActivityList() {
        const { ctx } = this;
        const res = await ctx.model.Activity.find();
        return res;
    }
    //获取某一活动详情
    async getActivityDetail(id) {
        const { ctx } = this;
        const res = await ctx.model.Activity.findById(id);
        return res;
    }

    async updateActivity(_id, name, description, startDate, endDate, firstChooseStartDate, firstChooseEndDate, secondChooseStartDate, secondChooseEndDate, thirdChooseStartDate, thirdChooseEndDate, stdChooseStartDate, stdChooseEndDate, firstChooseCount, secondChooseCount, thirdChooseCount, stdChooseCount) {
        const { ctx } = this;
        const res = await ctx.model.Activity.findByIdAndUpdate(_id,
            {
                name,
                description,
                startDate,
                endDate,
                firstChooseStartDate,
                firstChooseEndDate,
                secondChooseStartDate,
                secondChooseEndDate,
                thirdChooseStartDate,
                thirdChooseEndDate,
                stdChooseStartDate,
                stdChooseEndDate,
                firstChooseCount,
                secondChooseCount,
                thirdChooseCount,
                stdChooseCount
            });
        if (!res) {
            return { code: 400, msg: '活动不存在' };
        }
        return { code: 200, msg: '活动更新成功' };
    }
    async deleteActivity(id) {
        const { ctx } = this;
        const res = await ctx.model.Activity.findByIdAndDelete(id);
        if (!res) {
            return { code: 404, msg: '活动不存在' };
        }
        return { code: 200, msg: '活动删除成功' };
    }
    async addTeacherToActivity(activityId, teacherId = null, studentId = null) {
        const { ctx } = this;
        try {
            const data = { activityId };
            if (teacherId) data.teacherId = teacherId;
            if (studentId) data.studentId = studentId;

            await ctx.model.UserInActivity.create(data);
            return { code: 200, msg: '添加成功' };
        } catch (error) {
            ctx.logger.error('添加用户到活动失败:', error);
            return { code: 500, msg: '添加失败' };
        }
    }

    async getUserList() {
        const { ctx } = this;
        const res = await ctx.model.Userinfo.find();
        return res;
    }

    //查询用户信息
    async getUserInfo(username, role) {
        const { ctx } = this;
        const query = {};

        // 添加条件查询
        if (username) query.username = { $regex: new RegExp(escapeRegex(username), 'i') };
        if (role) query.role = role;

        const res = await ctx.model.Userinfo.find(query);
        return res
    }
    //重置密码
    async resetPassword(username, password) {
        const { ctx } = this;
        const res = await ctx.model.Userinfo.findOne({ username });
        if (!res) {
            return { code: 400, msg: '用户不存在' };
        }
        //创建哈希对象
        const hash = crypto.createHash('sha256').update(password)
        //生成哈希值
        const passwordHash = hash.digest('hex')
        res.password = passwordHash;
        await res.save();
        return { code: 200, msg: '密码重置成功' };
    }
    //重置选中用户密码
    async resetSelectedPassword(selectedUsers, password) {
        const { ctx } = this;
        //创建哈希对象
        const hash = crypto.createHash('sha256').update(password)
        //生成哈希值
        const passwordHash = hash.digest('hex')
        const res = await ctx.model.Userinfo.updateMany({ username: { $in: selectedUsers } }, { password: passwordHash });
        return { code: 200, msg: `已重置 ${res.modifiedCount} 个用户的密码` };
    }




    //删除用户
    async deleteUser(id) {
        const { ctx } = this;
        const user = await ctx.model.Userinfo.findByIdAndDelete(id);
        if (!user) {
            return { code: 404, msg: '用户不存在' };
        }
        if (user.role === 'student') {
            await ctx.model.Student.deleteOne({ studentId: user.username });
        } else if (user.role === 'teacher') {
            await ctx.model.Teacher.deleteOne({ teacherId: user.username });
        }
        return { code: 200, msg: '用户删除成功' };
    }
    //更新用户信息
    async updateUser(id, username, role) {
        const { ctx } = this;
        const user = await ctx.model.Userinfo.findById(id);
        if (!user) {
            return { code: 404, msg: '用户不存在' };
        }
        if (username) user.username = username;
        if (role) user.role = role;
        await user.save();
        return { code: 200, msg: '用户信息更新成功' };
    }

    //查询某活动的所有用户
    async getUserListInActivity(activityId, username, role) {
        const { ctx } = this;
        // 确保activityId是字符串
        const activityIdStr = String(activityId);
        // 基础查询条件
        const query = {
            activityId: activityIdStr
        };

        // 创建一个数组来存储所有的查询条件
        const conditions = [];

        // 处理role参数
        if (role) {
            if (role === 'teacher') {
                conditions.push({ teacherId: { $exists: true } });
            } else if (role === 'student') {
                conditions.push({ studentId: { $exists: true } });
            } else {
                conditions.push({ role: role });
            }
        } else {
            // 如果没有指定role，默认查询有teacherId或studentId的记录
            conditions.push({
                $or: [
                    { teacherId: { $exists: true } },
                    { studentId: { $exists: true } }
                ]
            });
        }
        // 处理username参数 - 在teacherId和studentId字段中都进行模糊查询
        if (username) {
            // 确保username是字符串
            const usernameStr = String(username);
            // 添加username模糊查询条件
            const escapedUsername = escapeRegex(usernameStr);
            conditions.push({
                $or: [
                    { teacherId: { $regex: escapedUsername, $options: 'i' } },
                    { studentId: { $regex: escapedUsername, $options: 'i' } }
                ]
            });
        }

        // 如果有多个条件，使用$and操作符组合它们
        if (conditions.length > 0) {
            query.$and = conditions;
        }

        try {
            const res = await ctx.model.UserInActivity.find(query);
            return res;
        } catch (error) {
            ctx.logger.error('查询出错:', error);
            return [];
        }
    }

    //删除某活动的某一用户
    async deleteUserInActivity(_id) {
        const { ctx } = this;
        const res = await ctx.model.UserInActivity.findByIdAndDelete(_id);
        if (!res) {
            return { code: 404, msg: '记录不存在' };
        }
        return { code: 200, msg: '删除成功' };
    }
    //查询选择志愿列表
    async getSelectedList(studentId, activityId) {
        const { ctx } = this;
        const query = {};
        if (studentId) {
            query.studentId = { $regex: escapeRegex(studentId), $options: 'i' };
        }
        if (activityId) {
            query.activityId = activityId;
        }
        const res = await ctx.model.Choose.find(query);
        return res;
    }
    //删除某项选择志愿
    async deleteSelected(_id) {
        const { ctx } = this;
        const res = await ctx.model.Choose.findByIdAndDelete(_id);
        if (!res) {
            return { code: 404, msg: '志愿记录不存在' };
        }
        return { code: 200, msg: '删除成功' };
    }

    //查询最终志愿
    async getFinalList(studentId, teacherId, activityId) {
        const { ctx } = this;
        const query = {};
        if (studentId) {
            query.studentId = { $regex: escapeRegex(studentId), $options: 'i' };
        }
        if (teacherId) {
            query.teacherId = teacherId;
        }
        if (activityId) {
            query.activityId = activityId;
        }
        const res = await ctx.model.Final.find(query);
        return res;
    }

    //查询某活动的所有导师
    async getTeacherListInActivity(activityId) {
        const { ctx } = this;
        const query = { teacherId: { $exists: true } };
        if (activityId) {
            query.activityId = activityId;
        }
        // 先查询 UserInActivity 表
        const userInActivityList = await ctx.model.UserInActivity.find(query);
        const teacherIds = userInActivityList.map(item => item.teacherId);
        // 再查询 Teacher 表
        const teachers = await ctx.model.Teacher.find({
            teacherId: { $in: teacherIds }
        });
        return teachers;
    }

    //查询某活动的所有学生
    async getStudentListInActivity(activityId) {
        const { ctx } = this;
        const query = { studentId: { $exists: true } };
        if (activityId) {
            query.activityId = activityId;
        }
        // 先查询 UserInActivity 表
        const userInActivityList = await ctx.model.UserInActivity.find(query);
        const studentIds = userInActivityList.map(item => item.studentId);
        // 再查询 Student 表
        const students = await ctx.model.Student.find({
            studentId: { $in: studentIds }
        });
        return students;
    }

    //重置志愿
    async resetVolunteer(activityId, studentId) {
        const { ctx } = this;
        const res = await ctx.model.Choose.deleteMany({
            activityId: activityId,
            studentId: studentId
        });
        return { code: 200, msg: `已重置 ${res.deletedCount} 条志愿` };
    }

    //配置一个活动中某位老师最大可选学生数
    async configMaxSelectNum(activityId, teacherId, maxSelectNum) {
        const { ctx } = this;
        const res = await ctx.model.UserInActivity.updateOne({
            activityId: activityId,
            teacherId: teacherId
        }, {
            maxSelectNum: maxSelectNum
        });
        if (res.matchedCount === 0) {
            return { code: 404, msg: '未找到对应记录' };
        }
        return { code: 200, msg: '配置成功' };
    }
    //配置老师允许的专业
    async updateTeacherAllowedMajors(teacherId, allowedMajors) {
        const { ctx } = this;
        const teacher = await ctx.model.Teacher.findOneAndUpdate(
            { teacherId },
            { allowedMajors },
            { new: true }
        );
        if (!teacher) {
            return { code: 404, msg: '老师不存在' };
        }
        return { code: 200, msg: '专业限制已更新' };
    }
    //查询一个活动中某位老师最大可选学生数
    async getMaxSelectNum(activityId, teacherId) {
        const { ctx } = this;
        const res = await ctx.model.UserInActivity.findOne({
            activityId: activityId,
            teacherId: teacherId
        });
        return res;
    }
    //查询学生的最终志愿
    async getFinalChoose(studentId, activityId) {
        const { ctx } = this;
        const res = await ctx.model.Final.findOne({
            studentId: studentId,
            activityId: activityId
        });
        return res||{};
    }
    async uploadTeacherResume(teacherId, resumeName, resumePath) {
        const { ctx } = this;
        const fs = require('fs');
        const path = require('path');

        if (!teacherId || !resumeName || !resumePath) {
            return { code: 400, msg: '缺少必要参数' };
        }

        const teacher = await ctx.model.Teacher.findOne({ teacherId });
        if (!teacher) {
            return { code: 404, msg: '老师不存在' };
        }

        // 删除旧简历文件
        if (teacher.resumePath && teacher.resumePath !== resumePath) {
            try {
                let oldResumePath = teacher.resumePath;
                if (oldResumePath.startsWith('/')) {
                    oldResumePath = oldResumePath.substring(1);
                }
                const oldFilePath = path.normalize(path.join(__dirname, '..', oldResumePath));
                // 路径遍历检查
                const expectedBasePath = path.normalize(path.join(__dirname, '..', 'public'));
                if (oldFilePath.startsWith(expectedBasePath) && fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            } catch (e) {
                ctx.logger.warn('删除旧简历文件失败:', e.message);
            }
        }

        const updatedTeacher = await ctx.model.Teacher.findOneAndUpdate(
            { teacherId },
            { resumeName, resumePath },
            { new: true }
        );
        if (!updatedTeacher) {
            return { code: 404, msg: '老师信息不存在' };
        }
        return { code: 200, msg: '老师简历已上传' };
    }
    //查询某位老师简历并返回文件内容
    async getTeacherResume(teacherId) {
        const { ctx } = this;
        const fs = require('fs');
        const path = require('path');
        
        try {
            // 验证teacherId参数
            if (!teacherId) {
                return { code: 400, msg: '教师ID不能为空' };
            }
            
            // 查询教师信息
            const teacher = await ctx.model.Teacher.findOne({ teacherId });
            
            if (!teacher) {
                return { code: 404, msg: '老师不存在' };
            }
            
            // 检查是否有简历路径
            if (!teacher.resumePath) {
                return { code: 404, msg: '老师未上传简历' };
            }
            
            // 构建文件的完整路径
            // 注意：这里假设teacher.resumePath是类似'/public/uploads/filename.pdf'的格式
            const filePath = path.join(__dirname, '..', teacher.resumePath.substring(1));
            
            // 检查文件是否存在
            if (!fs.existsSync(filePath)) {
                return { code: 404, msg: '简历文件不存在' };
            }
            
            // 读取文件内容
            const fileContent = fs.readFileSync(filePath);
            
            // 根据文件扩展名设置content-type
            const fileExtension = path.extname(teacher.resumePath).toLowerCase();
            let contentType = 'application/octet-stream'; // 默认二进制流
            
            // 设置常见文件类型的content-type
            const contentTypeMap = {
                '.pdf': 'application/pdf',
                '.doc': 'application/msword',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.txt': 'text/plain'
            };
            
            if (contentTypeMap[fileExtension]) {
                contentType = contentTypeMap[fileExtension];
            }
            
            ctx.logger.info(`成功获取教师 ${teacherId} 的简历文件: ${teacher.resumeName}`);
            
            // 返回文件信息和内容
            return {
                code: 200,
                msg: '获取成功',
                resumeName: teacher.resumeName,
                contentType: contentType,
                fileContent: fileContent
            };
        } catch (error) {
            ctx.logger.error('获取老师简历文件失败:', error);
            return { code: 500, msg: '服务器错误', error: error.message };
        }
    }
}

module.exports = AdminService;
