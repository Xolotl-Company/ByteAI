
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
app.use(cors(), express.json());

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  try {
    const resp = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      { model: "gpt-3.5-turbo", messages },
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
    );
    res.json(resp.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server running on port ${port}`));