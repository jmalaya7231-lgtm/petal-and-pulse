import { useState } from "react";
import { AlertCircle, Plus } from "lucide-react";

export default function TaskForm({ subjects, initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [priority, setPriority] = useState(initial?.priority ?? "medium");
  const [type, setType] = useState(initial?.type ?? "task");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please give the task a title.");
      return;
    }
    if ((type === "quiz" || type === "exam") && !dueDate) {
      setError("Please choose a date for the quiz or exam, so it shows in your reminders.");
      return;
    }
    onSave({ title, description, subject, dueDate, priority, type });
  }

  return (
    <form className="card stack" onSubmit={submit}>
      <h3 style={{ margin: 0 }}>{initial ? "Edit task" : "New task"}</h3>

      <div className="field">
        <label htmlFor="task-title">Title</label>
        <input
          id="task-title"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder="e.g. Review cardiac pharmacology"
          autoFocus
        />
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="task-type">Type</label>
          <select
            id="task-type"
            className="select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="task">Task</option>
            <option value="quiz">Quiz reminder</option>
            <option value="exam">Exam reminder</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="task-date">Due date</label>
          <input
            id="task-date"
            className="input"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="task-priority">Priority</label>
          <select
            id="task-priority"
            className="select"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="task-subject">Subject</label>
          <select
            id="task-subject"
            className="select"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="">No subject</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="task-desc">Description (optional)</label>
        <textarea
          id="task-desc"
          className="textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          placeholder="Chapters, page numbers, anything you want to remember"
        />
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="row">
        <button className="btn btn-primary" type="submit">
          <Plus size={18} /> {initial ? "Save changes" : "Add task"}
        </button>
        <button className="btn btn-outline" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}