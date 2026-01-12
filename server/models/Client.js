import mongoose from "mongoose";

const ClientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    login: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["admin", "user", "client"], // ajuste se quiser
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Client", ClientSchema);
