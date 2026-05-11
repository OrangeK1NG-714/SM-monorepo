//创建活动表
module.exports = app => {
    const mongoose = app.mongoose;
    mongoose.pluralize(null);
    const Schema = mongoose.Schema;
    const ActivitySchema = new Schema({
        name: { type: String, required: true },
        description: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        firstChooseStartDate: { type: Date, required: true },
        firstChooseEndDate: { type: Date, required: true },
        secondChooseStartDate: { type: Date, required: true },
        secondChooseEndDate: { type: Date, required: true },
        thirdChooseStartDate: { type: Date, required: true },
        thirdChooseEndDate: { type: Date, required: true },
        stdChooseStartDate: { type: Date, required: true },
        stdChooseEndDate: { type: Date, required: true },
        firstChooseCount: { type: Number, default: 0 },
        secondChooseCount: { type: Number, default: 0 },
        thirdChooseCount: { type: Number, default: 0 },
        stdChooseCount: { type: Number, default: 0 },
        subscribeSent: { type: Boolean, default: false },
    }, { versionKey: false });
    return mongoose.model('Activity', ActivitySchema);
}   