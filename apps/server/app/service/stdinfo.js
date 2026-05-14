'use strict';

const Service = require('egg').Service;

class StdinfoService extends Service {
    //新增学生信息
    async writeUserMsg(name, gender, studentId, grade, classNum, phone, gpa, direction, major) {
        try {
            let student = await this.ctx.model.Student.findOne({ studentId });
            if (student) {
                student.data = { name, gender, studentId, grade, classNum, phone, gpa, direction, major };
                await student.save();
                return { code: 200, msg: '学生信息已更新', data: student };
            } else {
                const newStudent = await this.ctx.model.Student.create({
                    studentId,
                    data: { name, gender, studentId, grade, classNum, phone, gpa, direction, major }
                });
                return { code: 200, msg: '学生信息新增成功', data: newStudent };
            }
        } catch (error) {
            this.ctx.logger.error(error);
            return { code: 500, msg: '服务器错误' };
        }
    }

    //更新学生信息
    async updateUserMsg(name, gender, studentId, grade, classNum, phone, gpa, direction, major) {
        const student = await this.ctx.model.Student.findOne({ studentId });
        if (student) {
            student.data = { name, gender, studentId, grade, classNum, phone, gpa, direction, major };
            await student.save();
            return { code: 200, msg: '学生信息已更新', data: student };
        }
        return { code: 404, msg: '学生不存在' };
    }

    //新增学生选老师选项
    async selectTeacher(studentId, teacherId, order, isChose, activityId, createTime, subscribeTemplateId = '', subscribeStatus = '') {
        const activity = await this.ctx.model.Activity.findById(activityId);
        if (!activity) {
            return { code: 404, msg: '活动不存在' };
        }
        const now = new Date(createTime);
        const adjustedTime = new Date(createTime);
        const startDate = new Date(activity.stdChooseStartDate);
        const endDate = new Date(activity.stdChooseEndDate);
        if (now < startDate || now > endDate) {
            return { code: 400, msg: '不在选老师时间内' };
        }

        const student = await this.ctx.model.Student.findOne({ studentId });
        if (!student || !student.data || Object.keys(student.data).length === 0 || !student.data.name) {
            return { code: 400, msg: '请先完善个人信息后再选择导师' };
        }
        const teacher = await this.ctx.model.Teacher.findOne({ teacherId });
        if (student && teacher && teacher.allowedMajors && teacher.allowedMajors.length > 0) {
            const studentMajor = student.data?.major || '普通';
            if (!teacher.allowedMajors.includes(studentMajor)) {
                return { code: 400, msg: '该导师不接受您所在专业的学生选择' };
            }
        }

        const choose = await this.ctx.model.Choose.create({
            studentId,
            teacherId,
            order,
            isChose,
            activityId,
            createTime: adjustedTime,
            subscribeTemplateId,
            subscribeStatus,
        });
        return { code: 200, msg: '学生选老师选项已添加', data: choose };
    }

    //保存学生 openid
    async saveOpenid(code, studentId) {
        try {
            const openid = await this.service.wechat.getOpenid(code);
            const student = await this.ctx.model.Student.findOne({ studentId });
            if (!student) {
                return { code: 404, msg: '学生不存在' };
            }
            student.openid = openid;
            await student.save();
            return { code: 200, msg: 'openid 保存成功' };
        } catch (error) {
            this.ctx.logger.error('[saveOpenid] 错误:', error);
            return { code: 500, msg: error.message || '服务器错误' };
        }
    }

    //查询某活动的所有老师
    async getTeacherListInActivity(activityId) {
        const { ctx } = this;
        const res = await ctx.model.UserInActivity.find({ activityId: activityId, teacherId: { $exists: true } });
        return res;
    }

    //查询某学生是否在活动中
    async isInActivity(studentId, activityId) {
        const { ctx } = this;
        const res = await ctx.model.UserInActivity.findOne({ studentId: studentId, activityId: activityId });
        return res;
    }

    //查询学生信息
    async getStudentMsg(studentId) {
        const { ctx } = this;
        const res = await ctx.model.Student.findOne({ studentId });
        if (!res) {
            return { code: 404, msg: '学生不存在', data: null };
        }
        return { code: 200, msg: 'success', data: res };
    }

    //新增学生上传简历
    async uploadResume(fileName, filePath, studentId) {
        const { ctx } = this;
        const fs = require('fs');
        const path = require('path');

        const existing = await ctx.model.Resume.findOne({ studentId });
        if (existing) {
            // 删除旧文件
            if (existing.filePath) {
                const oldFilePath = path.join(this.config.baseDir, 'app', existing.filePath);
                try {
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                    }
                } catch (e) {
                    ctx.logger.warn('[uploadResume] 删除旧文件失败:', e.message);
                }
            }
            existing.fileName = fileName;
            existing.filePath = filePath;
            existing.createTime = new Date();
            await existing.save();
            return { code: 200, msg: '简历已更新' };
        }

        const resume = new ctx.model.Resume({
            studentId,
            fileName,
            filePath,
        });
        await resume.save();
        return { code: 200, msg: '简历上传成功' };
    }
}

module.exports = StdinfoService;
