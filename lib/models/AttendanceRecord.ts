import mongoose, { Model, model, Schema } from 'mongoose';

export interface IAttendanceRecord extends Document {
  user: Schema.Types.ObjectId;
  warehouse: Schema.Types.ObjectId;
  date: Date;
  firstLogin: Date;
  lastLogout: Date;
  loginCoordinates: { lat: number; lng: number };
  logoutCoordinates: { lat: number; lng: number };
  isLoginLocationValid: boolean;
  isLogoutLocationValid: boolean;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>({
  user: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  warehouse: { type: Schema.Types.ObjectId, ref: 'warehouses', required: true },
  date: { type: Date, required: true },
  firstLogin: { type: Date, required: true },
  lastLogout: { type: Date, default: null },
  loginCoordinates: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  logoutCoordinates: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  isLoginLocationValid: { type: Boolean, default: false },
  isLogoutLocationValid: { type: Boolean, default: false }
});

AttendanceRecordSchema.index({ user: 1, date: 1 }, { unique: true });

export const AttendanceRecord: Model<IAttendanceRecord> =
  mongoose.models.attendancerecords ||
  model('attendancerecords', AttendanceRecordSchema);
