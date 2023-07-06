import axios from 'axios';
import { BACKEND_URL } from './config';

export const fetchTodoList = async () => {
  const res = await axios.get(`${BACKEND_URL}/todos`);
  return res;
};

export const postTodo = async ({ title, description }) => {
  const res = await axios.post(
    `${BACKEND_URL}/todos`,
    { title: title, description: description },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  return res;
};

export const updateTodo = async ({ id, title, description }) => {
  const res = await axios.put(
    `${BACKEND_URL}/todos/${id}`,
    { title, description },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return res;
};

export const deleteTodo = async (id) => {
  const res = await axios.delete(`${BACKEND_URL}/todos/${id}`);
  return res;
};
