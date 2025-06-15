const API_BASE_URL =
  process.env.NODE_ENV === 'production'
  ? 'https://bingo-ivxo.onrender.com'
  : 'http://localhost:3000';

module.exports = {
  API_BASE_URL
};