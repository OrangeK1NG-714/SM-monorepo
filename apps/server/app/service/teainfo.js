'use strict';

const Service = require('egg').Service;

class TeainfoService extends Service {
    async getTeaDetail() {
        const data = await this.ctx.model.Teacher.find()
        return { code: 200, data }
    }

    //老师选学生-即（修改学生选老师选项）
    async updateChoose(studentId, teacherId, activityId) {
        const choose = await this.ctx.model.Choose.findOne({ studentId, teacherId, activityId })
        if (choose) {
            choose.isChose = !choose.isChose
            await choose.save()
            return { code: 200, msg: '学生选老师选项已修改', data: choose }
        }
        return { code: 404, msg: '选择记录不存在' }
    }

    //老师选学生（新增到老师选学生表）
    async selectStudent(studentId, teacherId, activityId, data, order) {
        const student = await this.ctx.model.Student.findOne({ studentId })
        const studentData = student?.data && Object.keys(student.data).length > 0 ? student.data : data
        if (!studentData || Object.keys(studentData).length === 0) {
            return { code: 400, msg: '该学生尚未完善个人信息，无法选择' }
        }
        const choose = await this.ctx.model.Final.create({ studentId, teacherId, activityId, data: studentData, order })
        return { code: 200, msg: '老师已选学生', data: choose }
    }

    //老师取消选择学生
    async cancelSelect(studentId, teacherId, activityId) {
        const res = await this.ctx.model.Final.deleteOne({ studentId, teacherId, activityId })
        return { code: 200, msg: '老师取消选择学生', data: res }
    }

    //查看final表中某位老师选择的学生情况
    async getSelectList(teacherId, activityId, studentId) {
        const query = {}
        if (teacherId) query.teacherId = teacherId
        if (activityId) query.activityId = activityId
        if (studentId) query.studentId = studentId
        console.log(query)
        console.log(123)
        const res = await this.ctx.model.Final.find(query)
        console.log(res)
        return res
    }

    //查询某导师是否在活动中
    async isInActivity(teacherId, activityId) {
        const res = await this.ctx.model.UserInActivity.findOne({ teacherId, activityId })
        return res
    }
}

module.exports = TeainfoService;
