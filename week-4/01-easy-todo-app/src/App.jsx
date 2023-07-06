import { useEffect, useState } from 'react';
import './App.css';
import { deleteTodo, fetchTodoList, postTodo, updateTodo } from './api';

function App() {
  const emptyTodo = { title: '', description: '' };
  const [newTodo, setNewTodo] = useState(emptyTodo);
  const [todoList, setTodoList] = useState([]);

  const getTodoList = async () => {
    try {
      const res = await fetchTodoList();
      if (res.data) {
        setTodoList(() => res.data);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const addTodo = async () => {
    try {
      await postTodo(newTodo);
      getTodoList();
      setNewTodo(() => emptyTodo);
    } catch (e) {
      console.log(e);
    }
  };

  const handleChange = (e, key) =>
    setNewTodo((prev) => {
      if (key === 'title') {
        return { ...prev, title: e.target.value };
      } else {
        return { ...prev, description: e.target.value };
      }
    });

  const removeTodo = async (id) => {
    try {
      await deleteTodo(id);
      getTodoList();
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    getTodoList();
  }, []);

  return (
    <>
      <h1>Todo App</h1>
      <div>
        <AddTodo
          title={newTodo.title}
          description={newTodo.description}
          handleChange={handleChange}
          addTodo={addTodo}
        />
        <div>
          <TodoList
            todoList={todoList}
            removeTodo={removeTodo}
            getTodoList={getTodoList}
          />
        </div>
      </div>
    </>
  );
}

// function Todo(props) {
//   // Add a delete button here so user can delete a TODO.
//   return <div>{props.title}</div>;
// }

function TodoList({ todoList, removeTodo, getTodoList }) {
  return todoList.map(({ id, title, description }) => (
    <Todo
      id={id}
      title={title}
      description={description}
      removeTodo={removeTodo}
      key={id}
      getTodoList={getTodoList}
    />
  ));
}

function AddTodo({ title, description, handleChange, addTodo }) {
  return (
    <div>
      <input
        type="text"
        value={title}
        onChange={(e) => handleChange(e, 'title')}
      />
      <input
        id="description"
        type="text"
        value={description}
        onChange={(e) => handleChange(e, 'description')}
      />
      <button onClick={addTodo}>Add</button>
    </div>
  );
}
function Todo({ id, title, description, removeTodo, getTodoList }) {
  const [isEditing, setIsEditing] = useState(false);
  const [todo, setTodo] = useState({ id, title, description });

  const handleChange = (e, key) => {
    console.log('handle change');
    setTodo((prev) => {
      if (key === 'title') {
        return { ...prev, title: e.target.value };
      } else {
        return { ...prev, description: e.target.value };
      }
    });
  };

  const handleSave = async () => {
    try {
      await updateTodo(todo);
      setIsEditing(false);
      getTodoList();
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div>
      {isEditing ? (
        <EditTodo
          id={todo.id}
          title={todo.title}
          description={todo.description}
          handleChange={handleChange}
          removeTodo={removeTodo}
          handleSave={handleSave}
        />
      ) : (
        <>
          <span>{title}</span>
          <span>{description}</span>
          <button
            onClick={() => {
              setIsEditing(true);
            }}
          >
            Edit
          </button>
          <button onClick={() => removeTodo(id)}>Delete</button>
        </>
      )}
    </div>
  );
}

function EditTodo({
  id,
  title,
  description,
  handleChange,
  removeTodo,
  handleSave,
}) {
  return (
    <div>
      <input
        type="text"
        value={title}
        onChange={(e) => handleChange(e, 'title')}
      />
      <input
        type="text"
        value={description}
        onChange={(e) => handleChange(e, 'description')}
      />
      <button onClick={handleSave}>save</button>
      <button onClick={() => removeTodo(id)}>Delete</button>
    </div>
  );
}

export default App;
