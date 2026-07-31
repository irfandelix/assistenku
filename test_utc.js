const now = new Date("2026-07-31T18:14:05Z"); // Actual UTC time when user calls at 01:14 WIB

// Get WIB time by adding 7 hours
const nowWibTime = now.getTime() + (7 * 60 * 60 * 1000);
const nowWib = new Date(nowWibTime);

// ALWAYS use getUTC* methods because nowWib represents the WIB time in UTC
const wibDate = nowWib.getUTCDate();
const wibMonth = nowWib.getUTCMonth();
const wibYear = nowWib.getUTCFullYear();

console.log("WIB Date:", wibDate);
console.log("WIB Month:", wibMonth);
console.log("WIB Year:", wibYear);

// Tomorrow WIB
const tomorrowWibTime = nowWibTime + (24 * 60 * 60 * 1000);
const tomorrowWib = new Date(tomorrowWibTime);
const tomorrowWibDate = tomorrowWib.getUTCDate();

console.log("Tomorrow WIB Date:", tomorrowWibDate);

// Target month logic
let targetMonth = wibMonth;
let targetYear = wibYear;

if (wibDate === 1) {
  targetMonth = wibMonth - 1;
  if (targetMonth < 0) {
    targetMonth = 11;
    targetYear--;
  }
}

console.log("Target Month:", targetMonth);
console.log("Target Year:", targetYear);

// Start of target month in WIB
const startOfMonthWibTime = Date.UTC(targetYear, targetMonth, 1, 0, 0, 0);
// End of target month in WIB
const endOfMonthWibTime = Date.UTC(targetMonth === 11 ? targetYear + 1 : targetYear, targetMonth === 11 ? 0 : targetMonth + 1, 1, 0, 0, 0);

// Convert WIB bounds back to UTC for Firestore query
const startOfMonthUtcTime = startOfMonthWibTime - (7 * 60 * 60 * 1000);
const endOfMonthUtcTime = endOfMonthWibTime - (7 * 60 * 60 * 1000);

console.log("Start UTC:", new Date(startOfMonthUtcTime).toISOString());
console.log("End UTC:", new Date(endOfMonthUtcTime).toISOString());

// Month Name
const dummyTargetDate = new Date(Date.UTC(targetYear, targetMonth, 15));
const monthName = dummyTargetDate.toLocaleString('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' });
console.log("Month Name:", monthName);
