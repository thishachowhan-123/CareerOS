const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Hello');
});

app.listen(5000, () => {
  console.log('Listening on port 5000');
});

setInterval(() => {
  console.log('Still alive:', new Date().toLocaleTimeString());
}, 5000);