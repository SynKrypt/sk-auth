// Generates a random n-character number entirely made up of digits
export const randomDigitIDGenerator = (noOfDigits = 10) => {
  const now = new Date().getTime();
  const partOne = Number(String(now).slice(3 - noOfDigits));
  const partTwo = Math.floor(Math.random() * Math.pow(10, 3));
  return String(partOne) + String(partTwo).padStart(3, "0");
};
