const Task = require("../models/Task");

// CREATE TASK
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;

    // Create new task
    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      userId: req.user   // Comes from auth middleware
    });

    res.status(201).json(task);

  } catch (error) {
    res.status(500).json({
      message: "Error creating task"
    });
  }
};
// GET ALL TASKS (only for logged-in user)
// GET ALL TASKS (with filtering)
exports.getTasks = async (req, res) => {
  try {
    const { status, priority, overdue } = req.query;

    // Base filter: only logged-in user's tasks
    let filter = { userId: req.user };

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Filter by priority
    if (priority) {
      filter.priority = priority;
    }

    // Overdue tasks
    if (overdue === "true") {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $ne: "Completed" };
    }

    const tasks = await Task.find(filter);

    res.status(200).json(tasks);

  } catch (error) {
    res.status(500).json({
      message: "Error fetching tasks"
    });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user   // ensures user owns the task
      },
      req.body,
      { new: true }       // return updated task
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(task);

  } catch (error) {
    res.status(500).json({
      message: "Error updating task"
    });
  }
};
// DELETE TASK
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted successfully" });

  } catch (error) {
    res.status(500).json({
      message: "Error deleting task"
    });
  }
};
