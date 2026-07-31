import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../lib/get-session";

const router = Router();

// GET /api/tasks — all tasks + subtasks for the logged-in user
router.get("/", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { search, priorities, listId, unassigned } = req.query;

  const priorityList = priorities
    ? (priorities as string).split(",")
    : undefined;

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      ...(listId && { listId: listId as string }),
      ...(unassigned === "true" && { listId: null }),
      ...(search && {
        title: { contains: search as string, mode: "insensitive" },
      }),
      ...(priorityList?.length && {
        priority: { in: priorityList },
      }),
    },
    include: { subtasks: true },
    orderBy: { dueDate: { sort: "asc", nulls: "last" } },
  });

  res.json(tasks);
});

// POST /api/tasks — create a task
router.post("/", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { title, description, priority, due_date, list_id } = req.body;

  const task = await prisma.task.create({
    data: {
      title,
      description: description ?? null,
      priority,
      dueDate: due_date ? new Date(due_date) : null,
      listId: list_id ?? null,
      userId,
    },
    include: { subtasks: true },
  });

  res.status(201).json(task);
});

router.get("/calendar", requireAuth, async (req, res) => {
  const userId = (req as any).user.id;

  const now = new Date();
  const year = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();
  const month = req.query.month ? parseInt(req.query.month as string, 10) : now.getMonth(); // 0-indexed

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      dueDate: { gte: start, lte: end },
    },
    include: { subtasks: true },
    orderBy: { dueDate: "asc" },
  });

  res.json(tasks);
});

// GET /api/tasks/lists — all lists for the logged-in user
router.get("/lists", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const lists = await prisma.taskList.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  res.json(lists);
});

// POST /api/tasks/lists — create a list
router.post("/lists", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { name, color, description } = req.body;

  const list = await prisma.taskList.create({
    data: { name, color, description: description ?? null, userId },
  });

  res.status(201).json(list);
});

// GET /api/tasks/lists/:id
router.get("/lists/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { id } = req.params;

  const list = await prisma.taskList.findFirst({
    where: { id, userId }, // userId check prevents accessing other users' lists
  });

  if (!list) {
    res.status(404).json({ error: "List not found" });
    return;
  }

  res.json(list);
});

// GET /api/tasks/:id
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { id } = req.params;

  const task = await prisma.task.findFirst({
    where: { id, userId },
    include: { subtasks: true },
  });

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(task);
});

// PUT /api/tasks/:id
router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { id } = req.params;
  const { title, description, priority, due_date, list_id } = req.body;

  const task = await prisma.task.update({
    where: { id, userId },
    data: {
      title,
      description: description ?? null,
      priority,
      dueDate: due_date ? new Date(due_date) : null,
      listId: list_id ?? null,
    },
    include: { subtasks: true },
  });

  res.json(task);
});

// PATCH /api/tasks/:id/toggle
router.patch("/:id/toggle", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { id } = req.params;
  const { completed } = req.body;

  const task = await prisma.task.update({
    where: { id, userId },
    data: { completed },
    include: { subtasks: true },
  });

  res.json(task);
});

// PATCH /api/tasks/:taskId/subtasks/:subtaskId/toggle
router.patch(
  "/:taskId/subtasks/:subtaskId/toggle",
  requireAuth,
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { taskId, subtaskId } = req.params;
    const { completed } = req.body;

    // Verify the parent task belongs to this user before touching the subtask
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const subtask = await prisma.subTask.update({
      where: { id: subtaskId, taskId },
      data: { completed },
    });

    res.json(subtask);
  }
);

// POST /api/tasks/:taskId/subtasks — add a subtask
router.post("/:taskId/subtasks", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { taskId } = req.params;
  const { title } = req.body;

  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const subtask = await prisma.subTask.create({
    data: { title, completed: false, taskId },
  });

  res.status(201).json(subtask);
});

// PUT /api/tasks/:taskId/subtasks/:subtaskId — rename a subtask
router.put("/:taskId/subtasks/:subtaskId", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { taskId, subtaskId } = req.params;
  const { title } = req.body;

  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const subtask = await prisma.subTask.update({
    where: { id: subtaskId, taskId },
    data: { title },
  });

  res.json(subtask);
});

// PATCH /api/tasks/:taskId/subtasks/:subtaskId/toggle
router.patch("/:taskId/subtasks/:subtaskId/toggle", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { taskId, subtaskId } = req.params;
  const { completed } = req.body;

  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const subtask = await prisma.subTask.update({
    where: { id: subtaskId, taskId },
    data: { completed },
  });

  res.json(subtask);
});

// DELETE /api/tasks/:taskId/subtasks/:subtaskId
router.delete("/:taskId/subtasks/:subtaskId", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { taskId, subtaskId } = req.params;

  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  await prisma.subTask.delete({ where: { id: subtaskId, taskId } });

  res.status(204).send();
});

// DELETE /api/tasks/:id
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { id } = req.params;

  await prisma.task.delete({
    where: { id, userId },
  });

  res.status(204).send();
});

// PUT /api/tasks/lists/:id
router.put("/lists/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { id } = req.params;
  const { name, color, description } = req.body;

  const updated = await prisma.taskList.update({
    where: { id, userId },
    data: { name, color, description: description ?? null },
  });

  res.json(updated);
});

// DELETE /api/tasks/lists/:id
router.delete("/lists/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { id } = req.params;

  await prisma.taskList.delete({
    where: { id, userId },
  });

  res.status(204).send();
});

export default router;
