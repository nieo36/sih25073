const bcrypt = require("bcryptjs");

async function hashPassword(passw) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(passw, salt);
  return hash;
}

async function compareHash(enteredPassword, storedHashedPassword) {
  const isMatch = await bcrypt.compare(enteredPassword, storedHashedPassword);
  return isMatch;
}

module.exports = {
  hashPassword,
  compareHash,
};
