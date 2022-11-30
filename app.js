const express = require("express");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
const path = require('path')
app.use(bodyParser.json());
app.set('view engine','ejs')
app.get('/',async(req,res)=>{
  const allTodos = await Todo.getTodos()
  if(req.accepts('html')){
    res.render('index',{
      allTodos
    })
  }else{
    res.json({
      allTodos
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
    const todos = await Todo.findAll();
    return response.json(todos);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

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
    const todo = await Todo.addTodo(request.body);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id/markAsCompleted", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.markAsCompleted();
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
    const todo = await Todo.findByPk(request.params.id);
   if(!todo){
    return response.json(false);

   }
   return response.json(true);

  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

module.exports = app;
