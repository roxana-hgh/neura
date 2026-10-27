import { Router } from "express";
import * as tasks from "@/modules/tasks/tasks.controller";
import * as lists from "@/modules/tasks/lists.controller";
import * as subtasks from "@/modules/tasks/subtasks.controller";

// Mounted at /api/tasks (behind requireAuth).
// Static paths (/calendar, /lists) must be registered before /:id.
const router = Router();

router.get("/", tasks.listTasks);
router.post("/", tasks.createTask);
router.get("/calendar", tasks.listCalendarTasks);

// Lists
router.get("/lists", lists.listLists);
router.post("/lists", lists.createList);
router.get("/lists/:id", lists.getList);
router.put("/lists/:id", lists.updateList);
router.delete("/lists/:id", lists.deleteList);

// Single task
router.get("/:id", tasks.getTask);
router.put("/:id", tasks.updateTask);
router.patch("/:id/toggle", tasks.toggleTask);
router.delete("/:id", tasks.deleteTask);

// Subtasks
router.post("/:taskId/subtasks", subtasks.createSubtask);
router.put("/:taskId/subtasks/:subtaskId", subtasks.renameSubtask);
router.patch("/:taskId/subtasks/:subtaskId/toggle", subtasks.toggleSubtask);
router.delete("/:taskId/subtasks/:subtaskId", subtasks.deleteSubtask);

export default router;
