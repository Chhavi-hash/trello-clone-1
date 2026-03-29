const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ✅ CORS FIX (IMPORTANT FOR VERCEL)
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://trello-clone-1-awom.vercel.app",
    "https://trello-clone-1-p6t1.vercel.app",
    "https://trello-clone-1-p6t1-git-main-chhavi-hashs-projects.vercel.app"
  ],
  credentials: true
}));

app.use(express.json());

// ✅ TEST ROUTE (IMPORTANT)
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

// ✅ HEALTH CHECK (Render uses this)
app.get("/healthz", (req, res) => {
  res.send("OK");
});

// ✅ ROUTES
app.use('/api', require('./src/routes'));

// ✅ GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message
    }
  });
});

// ✅ PORT FIX (VERY IMPORTANT FOR RENDER)
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});