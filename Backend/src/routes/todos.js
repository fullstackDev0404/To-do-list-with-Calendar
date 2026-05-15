const router = require("express").Router()
const mongoose = require("mongoose")
const Todo = require("../models/Todo")
const auth = require("../middleware/authMiddleware")

router.get("/get", auth, async(req,res)=>{
  try {
    const filter = { user: req.user.id }
    if (req.query.date) filter.date = req.query.date
    const todos = await Todo.find(filter).sort({ order: 1, timeFrom: 1 })
    res.json(todos)
  } catch(err) {
    console.error("[GET /todos]", err)
    res.status(500).json({ message: "Failed to fetch todos" })
  }
})

router.post("/create", auth, async(req,res)=>{
  try {
    const { title, description, date, timeFrom, timeTo, completed, priority, tags } = req.body

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" })
    }
    if (!date) {
      return res.status(400).json({ message: "Date is required" })
    }

    const sanitizedTags = Array.isArray(tags)
      ? tags.map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 10)
      : []

    const todo = await Todo.create({
      user: req.user.id,
      title: title.trim(),
      description: description?.trim() || "",
      date,
      timeFrom: timeFrom || "",
      timeTo: timeTo || "",
      completed: !!completed,
      priority: ["low","medium","high"].includes(priority) ? priority : "medium",
      tags: sanitizedTags
    })

    res.status(201).json(todo)
  } catch(err) {
    console.error("[POST /todos/create]", err)
    res.status(500).json({ message: "Failed to create todo" })
  }
})

router.put("/edit/:id", auth, async(req,res)=>{
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid todo ID" })
    }

    const { title, description, date, timeFrom, timeTo, completed, priority, tags } = req.body

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" })
    }
    if (!date) {
      return res.status(400).json({ message: "Date is required" })
    }

    const sanitizedTags = Array.isArray(tags)
      ? tags.map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 10)
      : []

    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        title: title.trim(),
        description: description?.trim() || "",
        date,
        timeFrom: timeFrom || "",
        timeTo: timeTo || "",
        completed: !!completed,
        priority: ["low","medium","high"].includes(priority) ? priority : "medium",
        tags: sanitizedTags
      },
      { new: true }
    )

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" })
    }

    res.json(todo)
  } catch(err) {
    console.error("[PUT /todos/edit]", err)
    res.status(500).json({ message: "Failed to update todo" })
  }
})

// Bulk reorder — receives [{id, order}, ...] and updates all at once
router.put("/reorder", auth, async(req,res)=>{
  try {
    const { items } = req.body // [{ id: string, order: number }]
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "items must be an array" })
    }
    await Promise.all(
      items.map(({ id, order }) =>
        Todo.updateOne(
          { _id: id, user: req.user.id },
          { $set: { order } }
        )
      )
    )
    res.json({ message: "Reordered" })
  } catch(err) {
    console.error("[PUT /todos/reorder]", err)
    res.status(500).json({ message: "Failed to reorder todos" })
  }
})

router.delete("/delete/:id", auth, async(req,res)=>{
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid todo ID" })
    }

    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    })

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" })
    }

    res.json({ message: "Deleted" })
  } catch(err) {
    console.error("[DELETE /todos/delete]", err)
    res.status(500).json({ message: "Failed to delete todo" })
  }
})

module.exports = router
