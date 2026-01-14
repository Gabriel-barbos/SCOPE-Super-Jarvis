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

    shareGroup: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Garantir consistência
RoutineSchema.pre("save", function (next) {
  if (!this.addVehicleToGroup) {
    this.vehicleGroup = null;
  }

  if (!this.shareVehicle) {
    this.shareGroup = null;
  }

  next();
});

export default mongoose.model("Routine", RoutineSchema);
