const mongoose = require('mongoose');

mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => {
    console.log('Connected to the database');
  })
  .catch((err) => console.log(err.message));
