const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User(username)
// Exercise(:_id, description, duration, date)

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
});

const User = mongoose.model("User", userSchema);

const findUser = async (querry) => {
  const result = await User.findOne(querry, (err, data) => {
    if (err) return console.error(err);
    return data;
  });
  return result;
};

const saveUser = async (data) => {
  let user = await findUser({ username: data });
  if (user) {
    return user;
  } else {
    user = await User.create({ username: data });
    return user;
  }
};

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async (req, res) => {
  const user = await saveUser(req.body.username);
  if (user) {
    res.json({
      username: user.username,
      _id: user._id,
    });
  } else {
    res.json({
      error: "Invalid User",
    });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
