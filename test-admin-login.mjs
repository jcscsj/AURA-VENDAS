import crypto from "crypto";

const email = "victorlukasuara@gmail.com";
const password = "15201773";

const passwordHash = crypto
  .createHash("sha256")
  .update(password)
  .digest("hex");

console.log("Email:", email);
console.log("Password:", password);
console.log("Password Hash:", passwordHash);
console.log("\nUse this hash to verify in the database:");
console.log(`SELECT * FROM admins WHERE email = '${email}';`);
