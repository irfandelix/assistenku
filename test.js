const nowUtc = new Date("2026-07-31T18:14:05Z"); // This is what new Date() would be at 01:14 WIB
const nowWib = new Date(nowUtc.getTime() + (7 * 60 * 60 * 1000)); 

console.log("nowWib:", nowWib.toISOString());
console.log("nowWib.getDate():", nowWib.getDate());

let targetMonthDate = nowWib;
if (nowWib.getDate() === 1) {
  targetMonthDate = new Date(nowWib.getFullYear(), nowWib.getMonth() - 1, 15);
}

console.log("targetMonthDate:", targetMonthDate.toISOString());

const startOfMonthWib = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth(), 1);
const endOfMonthWib = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth() + 1, 1);

console.log("startOfMonthWib:", startOfMonthWib.toISOString());
console.log("endOfMonthWib:", endOfMonthWib.toISOString());

const startOfMonthUtc = new Date(startOfMonthWib.getTime() - (7 * 60 * 60 * 1000));
const endOfMonthUtc = new Date(endOfMonthWib.getTime() - (7 * 60 * 60 * 1000));

console.log("startOfMonthUtc:", startOfMonthUtc.toISOString());
console.log("endOfMonthUtc:", endOfMonthUtc.toISOString());
