import mongoose from "mongoose";

const contactSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    category: {   
      type: String,
      required: true, 
    },
    message: {
      type: String,
      required: true,
      minlength: 10,
    },
    photo: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Contact = mongoose.model("Contact", contactSchema);
