import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDb } from "../src/db.js";
import User from "../models/User.js";
import Shipment from "../models/Shipment.js";

const carriers = ["BlueLine Logistics", "NorthStar Freight", "SwiftHaul", "Apex Carriers", "ZenRoute"];
const locations = ["Seattle, WA", "Los Angeles, CA", "Dallas, TX", "Chicago, IL", "Miami, FL", "New York, NY"];
const statuses = ["CREATED", "IN_TRANSIT", "DELIVERED", "ON_HOLD"];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function daysFromNow(n) { const d = new Date(); d.setDate(d.getDate() + n); return d; }

async function run() {
  await connectDb(process.env.MONGODB_URI);

  await Promise.all([User.deleteMany({}), Shipment.deleteMany({})]);

  const adminPass = await bcrypt.hash("Admin@123", 10);
  const empPass = await bcrypt.hash("Emp@123", 10);

  await User.create([
    { name: "Admin", email: "admin@tms.com", passwordHash: adminPass, role: "admin" },
    { name: "Employee", email: "employee@tms.com", passwordHash: empPass, role: "employee" }
  ]);

  const docs = [];
  for (let i = 1; i <= 100; i++) {
    const pickup = rand(locations);
    let delivery = rand(locations);
    if (delivery === pickup) delivery = rand(locations);

    const pickupDate = daysFromNow(-Math.floor(Math.random() * 20));
    const deliveryDate = daysFromNow(Math.floor(Math.random() * 12));

    docs.push({
      shipperName: `Shipper ${((i - 1) % 10) + 1}`,
      carrierName: rand(carriers),
      pickupLocation: pickup,
      deliveryLocation: delivery,
      pickupDate,
      deliveryDate,
      status: rand(statuses),
      rateUsd: 120 + Math.round(Math.random() * 1800),
      trackingNumber: `TRK-${String(i).padStart(5, "0")}-${1000 + i}`,
      reference: `REF-${Date.now()}-${i}`,
      weightKg: 10 + Math.round(Math.random() * 200),
      notes: "Seeded shipment record"
    });
  }

  await Shipment.insertMany(docs);

  console.log("Seed complete.");
  console.log("Admin: admin@tms.com / Admin@123");
  console.log("Employee: employee@tms.com / Emp@123");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
