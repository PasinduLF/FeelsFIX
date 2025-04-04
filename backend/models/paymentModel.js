import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    bank: { type: String, required: true },
    branch: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    image: { type: Object, required: true }
  },
  { minimize: false }
);

const paymentModel =
  mongoose.models.payment || mongoose.model("payment", paymentSchema);

export default paymentModel;
