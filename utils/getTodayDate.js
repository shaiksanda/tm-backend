const getTodayDate = () => {
  const now = new Date();

  // Convert to IST by adding 5 hours 30 minutes
  const istOffset = 5.5 * 60; // in minutes
  const istTime = new Date(now.getTime() + istOffset * 60 * 1000);

  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, "0");
  const date = String(istTime.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${date}`;
};

module.exports = getTodayDate;
