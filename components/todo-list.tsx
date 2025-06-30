"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2 } from "lucide-react"

type Task = {
  id: number
  text: string
  done: boolean
}

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [input, setInput] = useState("")

  const addTask = () => {
    if (input.trim()) {
      setTasks(prev => [...prev, { id: Date.now(), text: input.trim(), done: false }])
      setInput("")
    }
  }

  const toggleDone = (id: number) => {
    setTasks(prev =>
      prev.map(task => (task.id === id ? { ...task, done: !task.done } : task))
    )
  }

  const deleteTask = (id: number) => {
    setTasks(prev => prev.filter(task => task.id !== id))
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle className="text-xl">📝 To-Do List</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Add new task"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addTask()}
          />
          <Button onClick={addTask}>Add</Button>
        </div>

        <ul className="space-y-2">
          {tasks.map(task => (
            <li
              key={task.id}
              className="flex items-center justify-between bg-muted px-3 py-2 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={task.done}
                  onCheckedChange={() => toggleDone(task.id)}
                />
                <span className={task.done ? "line-through text-muted-foreground" : ""}>
                  {task.text}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteTask(task.id)}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
