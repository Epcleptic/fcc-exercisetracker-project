const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

// TODO: Add GET user's exercise log

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

const findUsers = async () => {
  const result = await User.find({}, (err, data) => {
    if (err) return console.error(err);
    return data;
  });
  return result;
};

const saveUser = async (data) => {
  let user = process.env.UNIQUE_USERS
    ? await findUser({ username: data })
    : null;
  if (user) {
    return user;
  } else {
    user = await User.create({ username: data });
    return user;
  }
};

const exerciseSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

const findExercise = async (querry) => {
  const result = await Exercise.findOne(querry, (err, data) => {
    if (err) return console.error(err);
    return data;
  });
  return result;
};

const findExercises = async (querry) => {
  const result = await Exercise.find(querry, (err, data) => {
    if (err) return console.error(err);
    return data;
  });
  return result;
};

const saveExercise = async (data) => {
  let exercise = await findExercise(data);
  if (exercise) {
    return exercise;
  } else {
    exercise = await Exercise.create(data);
    return exercise;
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

app.get("/api/users", async (req, res) => {
  const users = await findUsers();
  if (users) {
    res.json(
      users.map((user) => ({
        _id: user._id,
        username: user.username,
      }))
    );
  } else {
    res.json({
      error: "No Users Found",
    });
  }
});

app.post("/api/users/:id/exercises", async (req, res) => {
  const user = await findUser({ _id: req.params.id });
  if (user) {
    const exercise = await saveExercise({
      user_id: req.params.id,
      description: req.body.description,
      duration: Number(req.body.duration),
      date: req.body.date ? new Date(Date.parse(req.body.date)) : new Date(),
    });
    if (exercise) {
      res.json({
        _id: user.id,
        username: user.username,
        date: exercise.date.toDateString(),
        duration: exercise.duration,
        description: exercise.description,
      });
    }
  }
});

app.get("/api/users/:id/logs", async (req, res) => {
  const user = await findUser({ _id: req.params.id });
  if (user) {
    let exercises = await findExercises({ user_id: user.id });
    if (req.query.from) {
      const from = new Date(Date.parse(req.query.from));
      exercises = exercises.filter((exercise) => exercise.date >= from);
    }
    if (req.query.to) {
      const to = new Date(Date.parse(req.query.to));
      exercises = exercises.filter((exercise) => exercise.date <= to);
    }
    if (req.query.limit) {
      const limit = req.query.limit;
      exercises = exercises.slice(0, limit);
    }
    res.json({
      _id: user.id,
      username: user.username,
      count: exercises.length,
      log: exercises.map((exercise) => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
      })),
    });
  } else {
    res.json({
      error: "Invalid User",
    });
  }
});

const PORT = process.env.USE_FIXED_PORT ? 3000 : process.env.PORT || 3000;
const listener = app.listen(PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
