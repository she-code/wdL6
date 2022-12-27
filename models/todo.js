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
      Todo.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }

    static addTodo({ title, dueDate, userId }) {
      return this.create({
        title: title,
        dueDate: dueDate,
        completed: false,
        userId,
      });
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
    static async remove(id, userId) {
      return this.destroy({
        where: {
          id,
          userId,
        },
      });
    }
    static async getAllTodos(userId) {
      const overdueLists = await Todo.overdue(userId);

      const dueTodayLists = await Todo.dueToday(userId);

      const dueLaterLists = await Todo.dueLater(userId);
      const completedItems = await Todo.getCompletedItems(userId);

      return { overdueLists, dueTodayLists, dueLaterLists, completedItems };
    }

    static async overdue(userId) {
      // FILL IN HERE TO RETURN OVERDUE ITEMS
      return Todo.findAll({
        where: {
          dueDate: {
            [Op.lt]: new Date(),
          },
          userId,
          completed: false,
        },
      });
    }

    static async dueToday(userId) {
      // FILL IN HERE TO RETURN ITEMS DUE tODAY
      return Todo.findAll({
        where: {
          dueDate: {
            [Op.eq]: new Date(),
          },
          userId,
          completed: false,
        },
        order: [["id", "ASC"]],
      });
    }

    static async dueLater(userId) {
      // FILL IN HERE TO RETURN ITEMS DUE LATER
      return Todo.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date(),
          },
          userId,
          completed: false,
        },
        order: [["id", "ASC"]],
      });
    }
    static async getCompletedItems(userId) {
      // FILL IN HERE TO RETURN ITEMS DUE LATER
      return Todo.findAll({
        where: {
          userId,
          completed: true,
        },
        order: [["id", "ASC"]],
      });
    }
  }
  Todo.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          len: 5,
        },
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notNull: true,
        },
      },
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
