import app from './app.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] Spend-A-Friend server is running on port ${PORT}`);
  console.log(`[Server] API URL: http://localhost:${PORT}/api`);
  console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
});

export default app;
