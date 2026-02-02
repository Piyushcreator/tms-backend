import mongoose from "mongoose";

const ShipmentSchema = new mongoose.Schema(
  {
    shipperName: { type: String, required: true, index: true },
    carrierName: { type: String, required: true, index: true },
    pickupLocation: { type: String, required: true, index: true },
    deliveryLocation: { type: String, required: true, index: true },

    pickupDate: { type: Date, required: true, index: true },
    deliveryDate: { type: Date, required: true, index: true },

    status: {
      type: String,
      required: true,
      enum: ["CREATED", "IN_TRANSIT", "DELIVERED", "ON_HOLD"],
      index: true
    },

    rateUsd: { type: Number, required: true },

    trackingNumber: { type: String, required: true, unique: true, index: true },

    reference: { type: String, default: "" },
    weightKg: { type: Number, default: 0 },
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);

// Perf: text search + common sort/filter indexes
ShipmentSchema.index({
  shipperName: "text",
  carrierName: "text",
  pickupLocation: "text",
  deliveryLocation: "text",
  trackingNumber: "text",
  reference: "text"
});
ShipmentSchema.index({ status: 1, deliveryDate: -1 });

export default mongoose.model("Shipment", ShipmentSchema);
