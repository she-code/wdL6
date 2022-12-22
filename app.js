const express = require("express");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
const path = require('path')
const csurf = require('tiny-csrf')
const cookieParser = require("cookie-parser")

app.use(bodyParser.json());
app.use(express.urlencoded({extended:false}))
app.use(cookieParser("secret string"))
app.use(csurf("this_should_be_32_character_long",["POST","PUT","DELETE"]))
app.set('view engine','ejs')

app.get('/',async(req,res)=>{
const {overdueLists,dueTodayLists,dueLaterLists,completedItems} = await Todo.getAllTodos();
    if(req.accepts('html')){
    res.render('index',{
      overdueLists,dueTodayLists,dueLaterLists,completedItems,csrfToken:req.csrfToken()
    })
  }else{
    res.json({
      overdueLists,dueTodayLists,dueLaterLists,completedItems
    })
  }
})
app.use(express.static(path.join(__dirname,'public')))
app.get("/",  async(request, response) =>{
  const allTodos = await Todo.getTodos()
  if(request.accepts('html')){
    response.send("Hello World");
  }else{
    res.json({
      allTodos
    })
  }
});

app.get("/todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");
  // FILL IN YOUR CODE HERE
  try {
    const {overdueLists,dueTodayLists,dueLaterLists} = await Todo.getAllTodos();
    return response.json({overdueLists,dueTodayLists,dueLaterLists});
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});
// app.get("/todos/overDue", async function (request, response) {
//   try {
//     const overDuetodos = await Todo.getOverDueTodos()
//     return response.json(overDuetodos);
//   } catch (error) {
//     console.log(error);
//     return response.status(422).json(error);
//   }});

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", async function (request, response) {
  try {
   // const todo = 
    await Todo.addTodo(request.body);
   // return response.json(todo);
   return response.redirect('/')
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  const {completed} = request.body
  try {
    const updatedTodo = await todo.setCompletionStatus(completed);
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async function (request, response) {
  console.log("We have to delete a Todo with ID: ", request.params.id);
  // FILL IN YOUR CODE HERE
  try {
    await Todo.remove(request.params.id);
    return response.json(true);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

module.exports = app;
