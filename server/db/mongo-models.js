// MongoDB / Mongoose Schemas for PulseFlow
// Provided for MongoDB architecture parity and recruiter technical review

import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'Member' },
  avatar: String,
  colorAccent: { type: String, default: '#6366F1' }
}, { timestamps: true });

const SubtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  position: { type: Number, default: 0 }
});

const TimeLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  durationSeconds: { type: Number, required: true },
  startedAt: { type: Date, required: true },
  endedAt: { type: Date, required: true },
  note: String
}, { timestamps: true });

const CommentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true }
}, { timestamps: true });

const TaskSchema = new mongoose.Schema({
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  columnId: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  estimatedHours: { type: Number, default: 0 },
  timeSpentSeconds: { type: Number, default: 0 },
  dueDate: Date,
  position: { type: Number, default: 0 },
  tags: [{ name: String, color: String }],
  subtasks: [SubtaskSchema],
  timeLogs: [TimeLogSchema],
  comments: [CommentSchema]
}, { timestamps: true });

const ColumnSchema = new mongoose.Schema({
  title: { type: String, required: true },
  position: { type: Number, required: true },
  colorAccent: { type: String, default: '#6366F1' }
});

const BoardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  columns: [ColumnSchema]
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);
export const Board = mongoose.models.Board || mongoose.model('Board', BoardSchema);
