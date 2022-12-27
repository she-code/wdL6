//import packages
const express = require("express");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const localStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");
const path = require("path");
const csurf = require("tiny-csrf");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

//import files
const { Todo, User } = require("./models");

//create application
const app = express();

const saltRounds = 10;

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("secret string"));
app.use(csurf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

//set view engines
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: "my-super-secret-key-givesuTime3333",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

//authenticatie user with passport
passport.use(
  new localStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => [
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          if (!user) {
            return done(null, false, { message: "No user found" });
          }
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch((error) => {
          return done(error);
        }),
    ]
  )
);

passport.serializeUser((user, done) => {
  console.log("Seralizing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => done(error, null));
});
app.use(express.static(path.join(__dirname, "public")));

//render views
app.get("/", async (req, res) => {
  res.render("index", {
    title: "Todo application",
    csrfToken: req.csrfToken(),
  });
});
app.get("/users", async (req, res) => {
  res.render("users", {
    title: "Users",
    csrfToken: req.csrfToken(),
  });
});
app.get("/todos", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const loggedInUser = req.user.id;
  const { overdueLists, dueTodayLists, dueLaterLists, completedItems } =
    await Todo.getAllTodos(loggedInUser);
  if (req.accepts("html")) {
    res.render("todos", {
      overdueLists,
      dueTodayLists,
      dueLaterLists,
      completedItems,
      csrfToken: req.csrfToken(),
    });
  } else {
    res.json({
      overdueLists,
      dueTodayLists,
      dueLaterLists,
      completedItems,
    });
  }
});
app.get("/signup", (request, response) => {
  response.render("signup", {
    title: "Sign Up",
    csrfToken: request.csrfToken(),
  });
});
app.get("/login", (request, response) => {
  response.render("login", {
    title: "Login",
    csrfToken: request.csrfToken(),
  });
});

//signout user
app.get("/signout", (request, response, next) => {
  request.logOut((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

//register user
app.post("/users", async (request, response) => {
  const { firstName, lastName, email, password } = request.body;
  const hashedPwd = await bcrypt.hash(password, saltRounds);
  //create user
  try {
    const user = await User.create({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashedPwd,
    });
    request.logIn(user, (err) => {
      if (err) {
        console.log(err);
      }
      response.redirect("/todos");
    });
  } catch (error) {
    // if (error.name === "SequelizeValidationError") {
    //   for (var key in error.errors) {
    //     request.flash("error", "Title must have minimum of 5 characters");
    //   }
    //   response.redirect("/todos");
     
    // }
  
    if(error.name === 'SequelizeUniqueConstraintError'){
      request.flash("error", "Email already exists");
      response.redirect("/todos");
    }
    console.log(error);
  }
});

//login user
app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  async (request, response) => {
    const { email, password } = request.body;
    console.log(request.user);
    response.redirect("/todos");
  }
);

//get todo by id
app.get("/todos/:id", async function (request, response) {
  try {
    const userId = request.user.id
    const todo = await Todo.findOne({where:{id:request.params.id,userId}});
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

//create todo
app.post(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      const { title, dueDate, userId } = request.body;
      await Todo.addTodo({
        title: title,
        dueDate: dueDate,
        userId: request.user.id,
      });
      return response.redirect("/todos");
    } catch (error) {
      //console.log(error.name)
      console.log(error.message);

      if (error.name === "SequelizeValidationError") {
        for (var key in error.errors) {
          request.flash("error", "Title must have minimum of 5 characters");
        }
        response.redirect("/todos");
       
      }
      //invalid date
    if(error.name =="SequelizeDatabaseError"){
        request.flash("error", "Invalid date");
        response.redirect("/todos");
       
      }
    
    }
  }
);

//update todo
app.put(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const todo = await Todo.findByPk(request.params.id);
    const { completed } = request.body;
    try {
      const updatedTodo = await todo.setCompletionStatus(completed);
      return response.json(updatedTodo);
    } catch (error) {
      console.log(error.message);
      return response.status(422).json(error);
    }
  }
);

//delete todo
app.delete(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("We have to delete a Todo with ID: ", request.params.id);
    const userId = request.user.id;
    try {
      await Todo.remove(request.params.id, userId);
      return response.json(true);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);
//get all users
app.get('/users/all',async(req,res)=>{
  const users = await User.findAll();
  res.status(200).json({
    users
  })
})
//delete user by id
app.post('/users/id',async(req,res)=>{
const {id} = req.body
  const user = await User.findOne({where:{id}})
  await user.destroy()
  res.send(true)
})
module.exports = app;
