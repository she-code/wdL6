"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static addTodo({ title, dueDate }) {
      return this.create({ title: title, dueDate: dueDate, completed: false });
    }

    markAsCompleted() {
      return this.update({ completed: true });
    }
    static getTodos() {
      return this.findAll();
    }
    static getOverDueTodos() {
      var today = new Date();
      console.log(today);
      return this.findAll({
        where: {
          dueDate: {
            [Op.lt]: today,
          },
        },
      });
    }
    setCompletionStatus(completed) {
      return this.update({
        completed: completed,
      });
    }
    static async remove(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }
    static async getAllTodos() {
      const overdueLists = await Todo.overdue();

      const dueTodayLists = await Todo.dueToday();

      const dueLaterLists = await Todo.dueLater();
      const completedItems = await Todo.getCompletedItems();

      return { overdueLists, dueTodayLists, dueLaterLists, completedItems };
    }

    static async overdue() {
      // FILL IN HERE TO RETURN OVERDUE ITEMS
      return Todo.findAll({
        where: {
          dueDate: {
            [Op.lt]: new Date(),
          },
          completed: false,
        },
      });
    }

    static async dueToday() {
      // FILL IN HERE TO RETURN ITEMS DUE tODAY
      return Todo.findAll({
        where: {
          dueDate: {
            [Op.eq]: new Date(),
          },
          completed: false,
        },
        order: [["id", "ASC"]],
      });
    }

    static async dueLater() {
      // FILL IN HERE TO RETURN ITEMS DUE LATER
      return Todo.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date(),
          },
          completed: false,
        },
        order: [["id", "ASC"]],
      });
    }
    static async getCompletedItems() {
      // FILL IN HERE TO RETURN ITEMS DUE LATER
      return Todo.findAll({
        where: {
          completed: true,
        },
        order: [["id", "ASC"]],
      });
    }
  }
  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
