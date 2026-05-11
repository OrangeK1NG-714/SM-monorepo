'use strict';

const Controller = require('egg').Controller;
const fs = require('fs');
const path = require('path');

class StdinfoController extends Controller {
    //写入学生信息
    async writeUserMsg() {
        const { ctx, service } = this
        // console.log(ctx, service );

        const { name, gender, studentId, grade, classNum, phone, gpa, direction, major } = ctx.request.body

        const res = await service.stdinfo.writeUserMsg(name, gender, studentId, grade, classNum, phone, gpa, direction, major)
        console.log(res);
        ctx.send([], res.code, res.msg)
    }
    //更新学生信息
    async updateUserMsg() {
        const { ctx, service } = this
        const { name, gender, studentId } = ctx.request.body
        const res = await service.stdinfo.updateUserMsg(name, gender, studentId)
        ctx.send([], res.code, res.msg)
    }
    //新增学生选老师选项
    async selectTeacher() {
        const { ctx, service } = this
        const { studentId, teacherId, order, isChose, activityId, createTime, subscribeTemplateId, subscribeStatus } = ctx.request.body
        const res = await service.stdinfo.selectTeacher(studentId, teacherId, order, isChose, activityId, createTime, subscribeTemplateId, subscribeStatus)
        ctx.send([], res.code, res.msg)
    }
    //查询某活动的所有老师
    async getTeacherListInActivity() {
        const { ctx, service } = this
        const { activityId } = ctx.request.query
        const res = await service.stdinfo.getTeacherListInActivity(activityId)
        ctx.body = res
    }

    //查询某学生是否在活动中
    async isInActivity() {
        const { ctx, service } = this
        const { studentId, activityId } = ctx.request.query
        const res = await service.stdinfo.isInActivity(studentId, activityId)
        if(res){
            ctx.send([], 200, '学生在活动中')
        }else{
            ctx.send([], 201, '学生未在活动中')
        }
    }

    //查询学生信息
    async getStudentMsg() {
        const { ctx, service } = this
        const { studentId } = ctx.request.query
        const res = await service.stdinfo.getStudentMsg(studentId)
        ctx.body = res.data
    }

    //保存学生 openid（通过微信 code 换取）
    async saveOpenid() {
        const { ctx, service } = this
        const { code, studentId } = ctx.request.body
        if (!code || !studentId) {
            return ctx.send([], 400, '缺少参数 code 或 studentId')
        }
        const res = await service.stdinfo.saveOpenid(code, studentId)
        ctx.send([], res.code, res.msg)
    }

    //新增学生上传简历
    async uploadResume() {
        const { ctx, service } = this

        const { studentId } = ctx.request.body
        const file = ctx.request.files && ctx.request.files[0]

        if (!studentId) {
            return ctx.send([], 400, '学生ID不能为空');
        }
        if (!file) {
            return ctx.send([], 400, '请选择要上传的文件');
        }

        try {
            const uploadsDir = path.join(this.config.baseDir, 'app/public/uploads');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const ext = path.extname(file.filename);
            const savedFileName = `resume_${studentId}_${Date.now()}${ext}`;
            const savedFilePath = path.join(uploadsDir, savedFileName);

            fs.writeFileSync(savedFilePath, fs.readFileSync(file.filepath));

            const relativePath = `/public/uploads/${savedFileName}`;
            const res = await service.stdinfo.uploadResume(file.filename, relativePath, studentId)

            ctx.send([], res.code, res.msg)
        } catch (error) {
            ctx.logger.error('[uploadResume] 错误:', error);
            ctx.send([], 500, '上传失败，服务器错误');
        } finally {
            if (file && file.filepath) {
                try { fs.unlinkSync(file.filepath); } catch (e) { /* ignore */ }
            }
        }
    }

}

module.exports = StdinfoController;
