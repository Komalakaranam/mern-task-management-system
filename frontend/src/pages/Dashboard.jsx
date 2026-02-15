import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function Dashboard() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [activeView, setActiveView] = useState("Board");
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [now, setNow] = useState(new Date());
const [selectedDate, setSelectedDate] = useState(new Date());

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    dueDate: "",
  });

  // ================= AUTO REFRESH EVERY MINUTE =================
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // ================= FETCH =================
  const fetchTasks = async () => {
    try {
      const res = await API.get("/tasks");
      setTasks(res.data);
    } catch {
      localStorage.removeItem("token");
      navigate("/");
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // ================= REMINDER POPUP =================
  useEffect(() => {
    tasks.forEach((task) => {
      if (!task.dueDate) return;

      const diff = new Date(task.dueDate) - now;

      // 10 minute reminder
      if (diff > 0 && diff <= 10 * 60 * 1000) {
        alert(`Reminder: "${task.title}" is due in less than 10 minutes!`);
      }
    });
  }, [now]);

  // ================= TIME REMAINING =================
  const getTimeRemaining = (dueDate) => {
    const diff = new Date(dueDate) - now;
    if (diff <= 0) return { overdue: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    return { days, hours, minutes, overdue: false };
  };

  const isOverdue = (task) =>
    task.dueDate &&
    new Date(task.dueDate) < now &&
    task.status !== "Completed";

  // ================= CREATE =================
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await API.post("/tasks", formData);
    setShowModal(false);
    setFormData({
      title: "",
      description: "",
      priority: "Medium",
      dueDate: "",
    });
    fetchTasks();
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    await API.delete(`/tasks/${id}`);
    fetchTasks();
  };
const tasksForSelectedDate = tasks.filter((task) => {
  if (!task.dueDate) return false;

  const taskDate = new Date(task.dueDate);

  return (
    taskDate.getFullYear() === selectedDate.getFullYear() &&
    taskDate.getMonth() === selectedDate.getMonth() &&
    taskDate.getDate() === selectedDate.getDate()
  );
});

  // ================= STATUS =================
  const cycleStatus = async (task) => {
    const newStatus =
      task.status === "Pending"
        ? "In Progress"
        : task.status === "In Progress"
        ? "Completed"
        : "Pending";

    await API.put(`/tasks/${task._id}`, { status: newStatus });
    fetchTasks();
  };

  // ================= DRAG =================
  const onDragEnd = async (result) => {
    if (!result.destination) return;
    await API.put(`/tasks/${result.draggableId}`, {
      status: result.destination.droppableId,
    });
    fetchTasks();
  };

  const statuses = ["Pending", "In Progress", "Completed"];

  return (
    <div className="flex min-h-screen text-white bg-darkBg">

      {/* SIDEBAR */}
      <div className="w-64 bg-sidebarBg p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold text-lavender mb-10">
            TaskFlow
          </h2>

          <ul className="space-y-5">
            <li
              onClick={() => setActiveView("Board")}
              className="cursor-pointer hover:text-purplePrimary"
            >
              Board
            </li>

            <li
              onClick={() => setActiveView("Calendar")}
              className="cursor-pointer hover:text-purplePrimary"
            >
              Calendar
            </li>
          </ul>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/");
          }}
          className="bg-gradient-to-r from-purplePrimary to-violetSoft py-2 rounded-lg"
        >
          Logout
        </button>
      </div>

      {/* MAIN */}
      <div className="flex-1 p-10">

        <div className="flex justify-between mb-8">
          <h1 className="text-3xl font-bold text-lavender">
            {activeView}
          </h1>

          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-purplePrimary to-violetSoft px-5 py-2 rounded-lg"
          >
            + Create Task
          </button>
        </div>

        {/* ================= BOARD VIEW ================= */}
        {activeView === "Board" && (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid md:grid-cols-3 gap-6">

              {statuses.map((status) => (
                <Droppable droppableId={status} key={status}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="bg-cardBg p-4 rounded-xl min-h-[400px]"
                    >
                      <h2 className="mb-4 text-violetSoft">
                        {status}
                      </h2>

                      {tasks
                        .filter((t) => t.status === status)
                        .map((task, index) => {
                          const timeLeft =
                            task.dueDate &&
                            getTimeRemaining(task.dueDate);

                          return (
                            <Draggable
                              key={task._id}
                              draggableId={task._id}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`p-4 mb-4 rounded-lg border ${
                                    isOverdue(task)
                                      ? "border-red-500 bg-red-500/10 animate-pulse"
                                      : "border-gray-700 bg-darkBg"
                                  }`}
                                >
                                  <h3>{task.title}</h3>
                                  <p className="text-sm text-gray-400">
                                    {task.description}
                                  </p>

                                  {task.dueDate && (
                                    <div className="text-xs mt-2">
                                      <p>
                                        Due:{" "}
                                        {new Date(
                                          task.dueDate
                                        ).toLocaleString()}
                                      </p>

                                      {timeLeft?.overdue ? (
                                        <p className="text-red-400">
                                          Overdue
                                        </p>
                                      ) : (
                                        <p className="text-purplePrimary">
                                          ⏳ {timeLeft.days}d{" "}
                                          {timeLeft.hours}h{" "}
                                          {timeLeft.minutes}m
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  <div className="flex justify-between mt-3">
                                    <button
                                      onClick={() =>
                                        cycleStatus(task)
                                      }
                                      className="text-xs bg-purplePrimary px-2 py-1 rounded"
                                    >
                                      Change
                                    </button>

                                    <button
                                      onClick={() =>
                                        handleDelete(task._id)
                                      }
                                      className="text-xs bg-red-600 px-2 py-1 rounded"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}

                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}

            </div>
          </DragDropContext>
        )}

        {/* ================= CALENDAR VIEW ================= */}
        {activeView === "Calendar" && (
          <div className="bg-cardBg p-6 rounded-xl">
            <Calendar />

            <div className="mt-6">
              <h3 className="text-violetSoft mb-4">
                Tasks with Due Dates
              </h3>

              {tasks
                .filter((t) => t.dueDate)
                .map((task) => (
                  <p key={task._id} className="mb-2">
                    {task.title} —{" "}
                    {new Date(task.dueDate).toLocaleString()}
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* CREATE MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center">
            <div className="bg-cardBg p-8 rounded-xl w-96">
              <h2 className="mb-4 text-lavender">Add Task</h2>

              <form onSubmit={handleCreate} className="space-y-4">
                <input
                  type="text"
                  name="title"
                  placeholder="Title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full p-3 bg-darkBg border border-gray-700 rounded"
                />

                <textarea
                  name="description"
                  placeholder="Description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-3 bg-darkBg border border-gray-700 rounded"
                />

                <input
                  type="datetime-local"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full p-3 bg-darkBg border border-gray-700 rounded"
                />

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-gray-600 px-4 py-2 rounded"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="bg-purplePrimary px-4 py-2 rounded"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Dashboard;
