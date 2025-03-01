import mongoose from "mongoose";

interface IGroupTestMailStatus {
    email: string;
    status: 'pending' | 'sent' | 'failed';
    test: string;
}

const groupTestMailStatusSchema = new mongoose.Schema<IGroupTestMailStatus>({
    email: { type: String, required: true },
    status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending', required: true },
    test: {
        type: String,
        ref: "Test",
        required: true,
        index: true
    }
}, { timestamps: true });

groupTestMailStatusSchema.index({test: 1, email: 1}, {unique: true})

const GroupTestMailStatus = mongoose.model('GroupTestMailStatus', groupTestMailStatusSchema);
export default GroupTestMailStatus