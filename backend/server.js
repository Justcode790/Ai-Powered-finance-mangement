const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Backend API running' });
});

app.use('/api', require('./routes/predict'));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});

