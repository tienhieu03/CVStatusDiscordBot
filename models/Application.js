const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  company: String,
  position: String,
  applicationDate: String,
  method: String,
  links: String,
  status: {
    type: String,
    enum: ["Đã nộp", "Hẹn phỏng vấn", "Đã phỏng vấn", "Trượt"],
    default: "Đã nộp",
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Application", applicationSchema);
