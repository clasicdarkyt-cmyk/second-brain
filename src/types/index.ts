export interface Habit {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  icon?: string | null;
  frequency: "daily" | "weekly";
  isNumeric: boolean;
  targetValue?: number | null;
  unit?: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  logs: HabitLog[];
  todayCompleted: boolean;
  todayValue?: number | null;
  currentStreak: number;
  completionRate: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  value?: number | null;
  note?: string | null;
  createdAt: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  children: Folder[];
  _count?: { notes: number };
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  folder?: { id: string; name: string } | null;
  pinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string | null;
  parentId?: string | null;
  subtasks: Task[];
  order: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  start: string;
  end?: string | null;
  allDay: boolean;
  color: string;
  category?: string | null;
  reminder?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface PatternAlert {
  habitId: string;
  habitName: string;
  type: "below_target" | "low_completion" | "streak_broken";
  message: string;
  severity: "warning" | "critical";
}

export interface GreetingData {
  greeting: string;
  upcomingTasks: Task[];
  upcomingEvents: CalendarEvent[];
  alerts: PatternAlert[];
}
