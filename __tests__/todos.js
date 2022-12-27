const request = require("supertest");

const db = require("../models/index");
const app = require("../app");
const cheerio = require("cheerio");

let server, agent;
function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};
describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  // function for creating todo
  const createTodo = async (agent, completed) => {
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: completed,
      _csrf: csrfToken,
    });
  };

  //function to toggle the status of todo
  const toggleTodoComplete = async (agent, completed, latestTodo) => {
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    const response = await agent.put(`/todos/${latestTodo.id}`).send({
      completed: completed,
      _csrf: csrfToken,
    });
    return response;
  };
  test("Sign up", async () => {
    let res = await agent.get("/signup");
    let csrfToken = extractCsrfToken(res);

    res = await agent.post("/users").send({
      firstName: "Test",
      lastName: "User",
      email: "test@gmail.com",
      password: "12345678",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("Sign out", async () => {
    let res = await agent.get("/todos");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/todos");
    expect(res.statusCode).toBe(302);
  });
  test("Creates a todo and responds with json at /todos POST endpoint", async () => {
   //create new agent
   const agent = request.agent(server);
   await login(agent, "test@gmail.com", "12345678");
   const res = await agent.get("/todos");
   const csrfToken = extractCsrfToken(res);
   //  console.log(res.text)
   const response = await agent.post("/todos").send({
     title: "Buy milk",
     dueDate: new Date().toISOString(),
     completed: false,
     _csrf: csrfToken,
   });
   expect(response.statusCode).toBe(302);
  });

  test("Marks a todo with the given ID as complete", async () => {
    //create todo
    const agent = request.agent(server);
    await login(agent, "test@gmail.com", "12345678");

    await createTodo(agent, false);
    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueTodayLists.length;
    const latestTodo = parsedGroupedResponse.dueTodayLists[dueTodayCount - 1];

    //update to do
    const updatedTodo = await toggleTodoComplete(agent, true, latestTodo);
    const parsedUpdateResponse = JSON.parse(updatedTodo.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });
  test("Test to mark a todo incomplete", async () => {
    //create todo
    const agent = request.agent(server);
    await login(agent, "test@gmail.com", "12345678");

    await createTodo(agent, false);

    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueTodayLists.length;
    const latestTodo = parsedGroupedResponse.dueTodayLists[dueTodayCount - 1];

    //mark as compelete
    const updatedTodo = await toggleTodoComplete(agent, true, latestTodo);
    const parsedUpdateResponse = JSON.parse(updatedTodo.text);

    //mark as incomplete
    const inCompleteTodo = await toggleTodoComplete(agent, false, latestTodo);
    const parsedUpdatedResponse = JSON.parse(inCompleteTodo.text);

    expect(parsedUpdatedResponse.completed).toBe(false);
  });

  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    // FILL IN YOUR CODE HERE
    const agent = request.agent(server);
    await login(agent, "test@gmail.com", "12345678");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy ps3",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
  
    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueTodayLists.length;
    const latestTodo = parsedGroupedResponse.dueTodayLists[dueTodayCount - 1];
    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const deletedResponse = await agent
      .delete(`/todos/${latestTodo.id}`)
      .send({ _csrf: csrfToken });

    const parsedDeletedREsponse = JSON.parse(deletedResponse.text);

    expect(parsedDeletedREsponse).toBe(true);
  });
});
