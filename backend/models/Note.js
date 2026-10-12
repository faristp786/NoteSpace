import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      default: "Untitled Note",
      trim: true,
    },
    content: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const Note = mongoose.model("Note", noteSchema);
