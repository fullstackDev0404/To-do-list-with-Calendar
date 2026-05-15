import API from "./api"

export const fetchTodos = async(date)=>{
  const res = await API.get("/todos/get", { params: date ? { date } : {} })
  return res.data
}

export const createTodo = async(todo)=>{
  const res = await API.post("/todos/create", todo)
  return res.data
}

export const updateTodo = async(id, data)=>{
  const res = await API.put(`/todos/edit/${id}`, data)
  return res.data
}

export const deleteTodo = async(id)=>{
  const res = await API.delete(`/todos/delete/${id}`)
  return res.data
}
