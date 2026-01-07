// utils/date.js
const getDateNDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD
};

const getTodayDate = () => {
  return new Date().toLocaleDateString("en-CA");
};

module.exports = { getTodayDate, getDateNDaysAgo };
