const request = require("supertest");

const db = require("../models/index");
const app = require("../app");
const cheerio = require("cheerio");

let server, agent;
function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}
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

  test("Creates a todo and responds with json at /todos POST endpoint", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);
    //  console.log(res.text)
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
    // expect(response.header["content-type"]).toBe(
    //   "application/json; charset=utf-8"
    // );
    // const parsedResponse = JSON.parse(response.text);
    // expect(parsedResponse.id).toBeDefined();
  });

  test("Marks a todo with the given ID as complete", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueTodayLists.length;
    const latestTodo = parsedGroupedResponse.dueTodayLists[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const markASCompleteResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({
        completed: true,
        _csrf: csrfToken,
      });
    const parsedUpdateResponse = JSON.parse(markASCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });

  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    // FILL IN YOUR CODE HERE
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy ps3",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    // console.log("response",response.text)

    // const parsedResponse = JSON.parse(response.text);
    // console.log("Presponse",{parsedResponse})

    // const todoID = parsedResponse.id;
    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueTodayLists.length;
    const latestTodo = parsedGroupedResponse.dueTodayLists[dueTodayCount - 1];
    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const deletedResponse = await agent
      .delete(`/todos/${latestTodo.id}`)
      .send({ _csrf: csrfToken });

    const parsedDeletedREsponse = JSON.parse(deletedResponse.text);

    expect(parsedDeletedREsponse).toBe(true);
  });
});

// const parsedResponse = JSON.parse(response.text);
// const todoID = parsedResponse.id;

// expect(parsedResponse.completed).toBe(false);

// const markCompleteResponse = await agent
//   .put(`/todos/${todoID}/markASCompleted`)
//   .send();
// const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
// expect(parsedUpdateResponse.completed).toBe(true);

// test("Fetches all todos in the database using /todos endpoint", async () => {
//   await agent.post("/todos").send({
//     title: "Buy xbox",
//     dueDate: new Date().toISOString(),
//     completed: false,
//   });
//   await agent.post("/todos").send({
//     title: "Buy ps3",
//     dueDate: new Date().toISOString(),
//     completed: false,
//   });
//   const response = await agent.get("/todos");
//   const parsedResponse = JSON.parse(response.text);

//   expect(parsedResponse.length).toBe(4);
//   expect(parsedResponse[3]["title"]).toBe("Buy ps3");
// });
