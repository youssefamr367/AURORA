import mongoose from "mongoose";
const { Schema } = mongoose;

const OrderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  fabrics: [{ type: Schema.Types.ObjectId, ref: "Fabric" }],
  eshra: [{ type: Schema.Types.ObjectId, ref: "Eshra" }],
  paintings: [{ type: Schema.Types.ObjectId, ref: "Painting" }],
  marble: [{ type: Schema.Types.ObjectId, ref: "Marble" }],
  glass: [{ type: Schema.Types.ObjectId, ref: "Glass" }],
  supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
  description: { type: String },
  quantity: { type: Number, default: 1 },
});

const StatusHistorySchema = new Schema({
  status: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

const OrderSchema = new Schema(
  {
    orderId: { type: Number, required: true, unique: true },
    items: [OrderItemSchema],
    status: {
      type: String,
      enum: ["New", "manufacturing", "Done", "finished"],
      default: "New",
    },
    // Optional per-order SLA thresholds (in days) for coloring by status age
    // Example shape:
    // {
    //   New:            { greenDays: 1,  orangeDays: 3,  redDays: 7  },
    //   manufacturing:  { greenDays: 1,  orangeDays: 45, redDays: 50 },
    //   Done:           { greenDays: 1,  orangeDays: 10, redDays: 15 }
    // }
    statusSla: {
      type: new Schema(
        {
          New: {
            type: new Schema(
              {
                greenDays: { type: Number },
                orangeDays: { type: Number },
                redDays: { type: Number },
              },
              { _id: false }
            ),
          },
          manufacturing: {
            type: new Schema(
              {
                greenDays: { type: Number },
                orangeDays: { type: Number },
                redDays: { type: Number },
              },
              { _id: false }
            ),
          },
          Done: {
            type: new Schema(
              {
                greenDays: { type: Number },
                orangeDays: { type: Number },
                redDays: { type: Number },
              },
              { _id: false }
            ),
          },
        },
        { _id: false }
      ),
      default: undefined,
    },
    statusHistory: [StatusHistorySchema],
  },
  { timestamps: true }
);

// Middleware to automatically track status changes
OrderSchema.pre("save", function (next) {
  console.log("🔄 Save middleware triggered");
  console.log("Status modified:", this.isModified("status"));
  console.log("Current status:", this.status);
  console.log("Current history length:", this.statusHistory?.length || 0);

  if (this.isModified("status")) {
    // Add current status to history if it's not already there
    const currentStatus = this.status;
    const lastHistoryEntry = this.statusHistory[this.statusHistory.length - 1];

    console.log("📋 Last history entry:", lastHistoryEntry);
    console.log("📋 Comparing:", lastHistoryEntry?.status, "vs", currentStatus);

    if (!lastHistoryEntry || lastHistoryEntry.status !== currentStatus) {
      console.log("📝 Adding new status to history:", currentStatus);
      this.statusHistory.push({
        status: currentStatus,
        date: new Date(),
      });
      console.log(
        "✅ Status history updated. New length:",
        this.statusHistory.length
      );
    } else {
      console.log("⚠️ Status already exists in history, skipping");
    }
  } else {
    console.log("ℹ️ Status not modified, skipping history update");
  }
  next();
});

// Also handle findOneAndUpdate operations
OrderSchema.pre("findOneAndUpdate", function (next) {
  console.log("🔄 findOneAndUpdate middleware triggered");
  const update = this.getUpdate();
  console.log("Update data:", update);

  if (update && typeof update === "object" && "status" in update) {
    console.log("📝 Status update detected:", update.status);
    // We'll handle this in the controller since middleware can't modify the update
  }
  next();
});

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
