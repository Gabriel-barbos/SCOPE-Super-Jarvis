import mongoose from "mongoose";

const RoutineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    addVehicleToGroup: {
      type: Boolean,
      default: false,
    },

    vehicleGroup: {
      type: String,
      default: null,
    },

    shareVehicle: {
      type: Boolean,
      default: false,
    },
      clientIdentificator: {
      type: String,
      required: true,
      trim: true,
    },

groupIdentificator: {
  type: String,
  trim: false,
  required: false,
},
    shareGroup: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);


export default mongoose.model("Routine", RoutineSchema);
