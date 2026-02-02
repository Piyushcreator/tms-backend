import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import Shipment from "../../models/Shipment.js";
import { requireAuth, requireRole } from "./auth.js";

function toIso(d) {
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

function toShipment(doc) {
  return {
    id: doc._id.toString(),
    shipperName: doc.shipperName,
    carrierName: doc.carrierName,
    pickupLocation: doc.pickupLocation,
    deliveryLocation: doc.deliveryLocation,
    pickupDate: toIso(doc.pickupDate),
    deliveryDate: toIso(doc.deliveryDate),
    status: doc.status,
    rateUsd: doc.rateUsd,
    trackingNumber: doc.trackingNumber,
    reference: doc.reference,
    weightKg: doc.weightKg,
    notes: doc.notes,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt)
  };
}

function buildQuery(filter) {
  const q = {};
  if (!filter) return q;

  if (filter.status) q.status = filter.status;
  if (filter.shipperName) q.shipperName = new RegExp(filter.shipperName, "i");
  if (filter.carrierName) q.carrierName = new RegExp(filter.carrierName, "i");
  if (filter.pickupLocation) q.pickupLocation = new RegExp(filter.pickupLocation, "i");
  if (filter.deliveryLocation) q.deliveryLocation = new RegExp(filter.deliveryLocation, "i");

  if (filter.q && filter.q.trim()) q.$text = { $search: filter.q.trim() };
  return q;
}

const ALLOWED_SORT_FIELDS = new Set([
  "deliveryDate",
  "pickupDate",
  "rateUsd",
  "status",
  "shipperName",
  "carrierName",
  "createdAt"
]);

export const resolvers = {
  Query: {
    me: async (_, __, ctx) => ctx.user,

    shipment: async (_, { id }, ctx) => {
      requireAuth(ctx);
      const doc = await Shipment.findById(id).lean();
      return doc ? toShipment(doc) : null;
    },

    shipments: async (_, { filter, pagination, sort }, ctx) => {
      requireAuth(ctx);

      const limit = Math.min(Math.max(pagination?.limit ?? 10, 1), 100);
      const offset = Math.max(pagination?.offset ?? 0, 0);

      const sortBy = sort?.sortBy ?? "deliveryDate";
      const order = sort?.order === "asc" ? 1 : -1;
      const safeSortBy = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : "deliveryDate";

      const query = buildQuery(filter);

      // Perf: parallel count + fetch, and lean() for faster reads
      const [totalCount, docs] = await Promise.all([
        Shipment.countDocuments(query),
        Shipment.find(query)
          .sort({ [safeSortBy]: order })
          .skip(offset)
          .limit(limit)
          .lean()
      ]);

      return {
        nodes: docs.map(toShipment),
        totalCount,
        limit,
        offset
      };
    }
  },

  Mutation: {
    register: async (_, { name, email, password, role }) => {
      const normalizedEmail = email.toLowerCase().trim();
      const exists = await User.findOne({ email: normalizedEmail }).lean();
      if (exists) throw new Error("EMAIL_ALREADY_EXISTS");

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email: normalizedEmail, passwordHash, role });

      const token = jwt.sign(
        { sub: user._id.toString(), role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return {
        token,
        user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role }
      };
    },

    login: async (_, { email, password }) => {
      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) throw new Error("INVALID_CREDENTIALS");

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) throw new Error("INVALID_CREDENTIALS");

      const token = jwt.sign(
        { sub: user._id.toString(), role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return {
        token,
        user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role }
      };
    },

    addShipment: async (_, { input }, ctx) => {
      requireRole(ctx, ["admin"]);

      const doc = await Shipment.create({
        ...input,
        pickupDate: new Date(input.pickupDate),
        deliveryDate: new Date(input.deliveryDate)
      });

      return toShipment(doc);
    },

    updateShipment: async (_, { id, input }, ctx) => {
      requireRole(ctx, ["admin"]);

      const patch = { ...input };
      if (patch.pickupDate) patch.pickupDate = new Date(patch.pickupDate);
      if (patch.deliveryDate) patch.deliveryDate = new Date(patch.deliveryDate);

      const doc = await Shipment.findByIdAndUpdate(id, patch, { new: true }).lean();
      if (!doc) throw new Error("NOT_FOUND");

      return toShipment(doc);
    },

    deleteShipment: async (_, { id }, ctx) => {
      requireRole(ctx, ["admin"]);
      const res = await Shipment.deleteOne({ _id: id });
      return res.deletedCount === 1;
    }
  }
};
