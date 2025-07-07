"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import {
  Calendar,
  Link2,
  Clock,
  Edit3,
  Plus,
  Trash2,
  FileText,
  Menu,
  Github,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Download,
  Sparkles,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SimpleRichEditor } from "./components/simple-rich-editor"
import { useJsonStorage } from "@/hooks/use-json-storage"
import { useDebounce } from "@/hooks/use-debounce"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Textarea } from "@/components/ui/textarea"
import { ThemeToggle } from "@/components/theme-toggle"

interface TodoItem {
  id: string
  text: string
  completed: boolean
  time: string
  url?: string
  notes?: string
}

interface DayData {
  date: string
  fullDate: string
  todos: TodoItem[]
}

interface WeekData {
  id: string
  name: string
  days: DayData[]
}

interface MonthData {
  id: string
  name: string
  weeks: WeekData[]
  weeklyNotes: { [weekId: string]: string }
}

// Memoized TodoCard component to prevent unnecessary re-renders
const TodoCard = memo(
  ({
    todo,
    monthId,
    weekId,
    dayIndex,
    onUpdate,
    onDelete,
    onEdit,
  }: {
    todo: TodoItem
    monthId: string
    weekId: string
    dayIndex: number
    onUpdate: (updates: Partial<TodoItem>) => void
    onDelete: () => void
    onEdit: () => void
  }) => {
    const handleCheckboxChange = useCallback(
      (checked: boolean) => {
        onUpdate({ completed: checked })
      },
      [onUpdate],
    )

    const handleUrlClick = useCallback(() => {
      const decodedUrl = (todo.url ?? "").replace(/\\n/g, "\n")
      const urls = decodedUrl.split(/[\s,]+/)
      urls.forEach((url, index) => {
        const cleaned = url.trim()
        if (cleaned) {
          setTimeout(() => window.open(cleaned, "_blank"), index * 500)
        }
      })
    }, [todo.url])

    return (
      <div className="group flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-all duration-200 hover-enhanced">
        <Checkbox checked={todo.completed} onCheckedChange={handleCheckboxChange} className="mt-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium break-words ${
              todo.completed ? "line-through text-muted-foreground" : "text-foreground"
            }`}
          >
            {todo.text}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{todo.time}</span>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {todo.url && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUrlClick}
                    className="h-8 w-8 p-0 hover:bg-yellow-500/10 rounded-lg"
                  >
                    <Link2 className="h-4 w-4 text-yellow-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Open URL</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0 hover:bg-primary/10 rounded-lg">
            <Edit3 className="h-4 w-4 text-primary" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 w-8 p-0 hover:bg-red-500/10 rounded-lg">
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    )
  },
)

TodoCard.displayName = "TodoCard"

// Memoized DayCard component
const DayCard = memo(
  ({
    day,
    dayIndex,
    monthId,
    weekId,
    onAddTodo,
    onUpdateTodo,
    onDeleteTodo,
    onEditTodo,
    onCopy,
    onPaste,
    canCopy,
    canPaste,
    copyButtonState,
    pasteButtonState,
    copiedDayData,
  }: {
    day: DayData
    dayIndex: number
    monthId: string
    weekId: string
    onAddTodo: () => void
    onUpdateTodo: (todoId: string, updates: Partial<TodoItem>) => void
    onDeleteTodo: (todoId: string) => void
    onEditTodo: (todo: TodoItem) => void
    onCopy: () => void
    onPaste: () => void
    canCopy: boolean
    canPaste: boolean
    copyButtonState?: { showCheck: boolean; type: "copy" | "paste" }
    pasteButtonState?: { showCheck: boolean; type: "copy" | "paste" }
    copiedDayData: any
  }) => {
    return (
      <Card className="border-border shadow-sm hover:shadow-lg transition-all duration-200 enhanced-card rounded-xl overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-primary/90 to-primary text-primary-foreground primary-bg-text">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium orange-bg-text">{day.fullDate}</CardTitle>
            <div className="flex gap-1">
              {/* Copy Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={canCopy ? onCopy : undefined}
                      disabled={!canCopy}
                      className={`h-6 w-6 p-0 rounded-md transition-all duration-200 ${
                        canCopy
                          ? "hover:bg-white/20 text-white cursor-pointer"
                          : "text-white/40 cursor-not-allowed opacity-50"
                      }`}
                    >
                      {copyButtonState?.showCheck ? (
                        <Check className="h-3 w-3 text-green-400" />
                      ) : (
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{canCopy ? "Copy all tasks from this day" : "No tasks to copy from this day"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Paste Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={canPaste ? onPaste : undefined}
                      disabled={!canPaste}
                      className={`h-6 w-6 p-0 rounded-md transition-all duration-200 ${
                        canPaste
                          ? "hover:bg-white/20 text-white cursor-pointer"
                          : "text-white/40 cursor-not-allowed opacity-50"
                      }`}
                    >
                      {pasteButtonState?.showCheck ? (
                        <Check className="h-3 w-3 text-green-400" />
                      ) : (
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {canPaste
                        ? `Paste ${copiedDayData?.todos.length} task(s) from ${copiedDayData?.sourceDate}`
                        : "No tasks copied to paste"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {day.todos.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              <p className="text-sm">No tasks yet</p>
            </div>
          ) : (
            day.todos.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                monthId={monthId}
                weekId={weekId}
                dayIndex={dayIndex}
                onUpdate={(updates) => onUpdateTodo(todo.id, updates)}
                onDelete={() => onDeleteTodo(todo.id)}
                onEdit={() => onEditTodo(todo)}
              />
            ))
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onAddTodo}
            className="w-full mt-3 border-dashed border-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 rounded-lg py-2 font-medium transition-all duration-200 bg-transparent"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </CardContent>
      </Card>
    )
  },
)

DayCard.displayName = "DayCard"

const generateMonthsData = (): MonthData[] => {
  const months = [
    { name: "July", days: 31, startDay: 1 },
    { name: "August", days: 31, startDay: 4 },
    { name: "September", days: 30, startDay: 0 },
    { name: "October", days: 31, startDay: 2 },
  ]

  return months.map((month, monthIndex) => {
    const weeks: WeekData[] = []
    let currentWeek: DayData[] = []
    let weekNumber = 1

    for (let day = 1; day <= month.days; day++) {
      const dayData: DayData = {
        date: `${day}`,
        fullDate: `${month.name} ${day}`,
        todos: [],
      }

      currentWeek.push(dayData)

      if (currentWeek.length === 7 || day === month.days) {
        weeks.push({
          id: `${monthIndex}-week-${weekNumber}`,
          name: `Week ${weekNumber}`,
          days: [...currentWeek],
        })
        currentWeek = []
        weekNumber++
      }
    }

    return {
      id: month.name.toLowerCase(),
      name: month.name,
      weeks,
      weeklyNotes: {},
    }
  })
}

export default function ProductivityTracker() {
  const [gistConfig, setGistConfig] = useState({
    githubGistId: "",
    githubToken: "",
  })
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [showFetchConfirm, setShowFetchConfirm] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showMotivationModal, setShowMotivationModal] = useState(false)

  const {
    data: monthsData,
    setData: setMonthsData,
    isLoading,
    lastSaved,
    error,
    hasUnsavedChanges,
    isConfigured,
    hasInitialFetch,
    changesSinceLastFetch,
    fetchFromRemote,
    saveToRemote,
  } = useJsonStorage<MonthData[]>(
    "productivity-tracker-data",
    generateMonthsData(),
    gistConfig.githubGistId && gistConfig.githubToken ? gistConfig : undefined,
  )

  const [copiedDayData, setCopiedDayData] = useState<{
    todos: TodoItem[]
    sourceDate: string
  } | null>(null)
  const [showPasteConfirm, setShowPasteConfirm] = useState(false)
  const [pasteTarget, setPasteTarget] = useState<{
    monthId: string
    weekId: string
    dayIndex: number
    targetDate: string
  } | null>(null)

  const [buttonStates, setButtonStates] = useState<{
    [key: string]: { showCheck: boolean; type: "copy" | "paste" }
  }>({})

  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>("july")
  const [selectedWeek, setSelectedWeek] = useState<string>("")
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false)

  // Debounce config changes to reduce re-renders
  const debouncedGistConfig = useDebounce(gistConfig, 500)

  // Load saved Gist config on mount
  useEffect(() => {
    const saved = localStorage.getItem("gist-config")
    if (saved) {
      const parsedConfig = JSON.parse(saved)
      setGistConfig(parsedConfig)
    }
  }, [])

  // Auto-select first week when month changes
  useEffect(() => {
    const currentMonth = monthsData.find((m) => m.id === selectedMonth)
    if (currentMonth && currentMonth.weeks.length > 0 && !selectedWeek) {
      setSelectedWeek(currentMonth.weeks[0].id)
    }
  }, [selectedMonth, monthsData, selectedWeek])

  // Memoize expensive calculations
  const isDataEmpty = useMemo(() => {
    return monthsData.every((month) =>
      month.weeks.every(
        (week) =>
          week.days.every((day) => day.todos.length === 0) &&
          (!month.weeklyNotes[week.id] || month.weeklyNotes[week.id].trim() === ""),
      ),
    )
  }, [monthsData])

  const isSaveDisabled = useMemo(() => {
    return (
      !debouncedGistConfig.githubGistId ||
      !debouncedGistConfig.githubToken ||
      isLoading ||
      !hasInitialFetch ||
      !changesSinceLastFetch
    )
  }, [debouncedGistConfig, isLoading, hasInitialFetch, changesSinceLastFetch])

  // Memoized handlers to prevent unnecessary re-renders
  const addNewTodo = useCallback(
    (monthId: string, weekId: string, dayIndex: number) => {
      const newTodo: TodoItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: "New task",
        completed: false,
        time: "9:00 AM",
        url: "",
        notes: "",
      }

      setMonthsData((prev) =>
        prev.map((month) => {
          if (month.id === monthId) {
            return {
              ...month,
              weeks: month.weeks.map((week) => {
                if (week.id === weekId) {
                  return {
                    ...week,
                    days: week.days.map((day, idx) => {
                      if (idx === dayIndex) {
                        return {
                          ...day,
                          todos: [...day.todos, newTodo],
                        }
                      }
                      return day
                    }),
                  }
                }
                return week
              }),
            }
          }
          return month
        }),
      )
    },
    [setMonthsData],
  )

  const deleteTodo = useCallback(
    (monthId: string, weekId: string, dayIndex: number, todoId: string) => {
      setMonthsData((prev) =>
        prev.map((month) => {
          if (month.id === monthId) {
            return {
              ...month,
              weeks: month.weeks.map((week) => {
                if (week.id === weekId) {
                  return {
                    ...week,
                    days: week.days.map((day, idx) => {
                      if (idx === dayIndex) {
                        return {
                          ...day,
                          todos: day.todos.filter((todo) => todo.id !== todoId),
                        }
                      }
                      return day
                    }),
                  }
                }
                return week
              }),
            }
          }
          return month
        }),
      )
    },
    [setMonthsData],
  )

  const updateTodo = useCallback(
    (monthId: string, weekId: string, dayIndex: number, todoId: string, updates: Partial<TodoItem>) => {
      setMonthsData((prev) =>
        prev.map((month) => {
          if (month.id === monthId) {
            return {
              ...month,
              weeks: month.weeks.map((week) => {
                if (week.id === weekId) {
                  return {
                    ...week,
                    days: week.days.map((day, idx) => {
                      if (idx === dayIndex) {
                        return {
                          ...day,
                          todos: day.todos.map((todo) => (todo.id === todoId ? { ...todo, ...updates } : todo)),
                        }
                      }
                      return day
                    }),
                  }
                }
                return week
              }),
            }
          }
          return month
        }),
      )
    },
    [setMonthsData],
  )

  const updateWeeklyNotes = useCallback(
    (monthId: string, weekId: string, notes: string) => {
      setMonthsData((prev) =>
        prev.map((month) => {
          if (month.id === monthId) {
            return {
              ...month,
              weeklyNotes: {
                ...month.weeklyNotes,
                [weekId]: notes,
              },
            }
          }
          return month
        }),
      )
    },
    [setMonthsData],
  )

  const showButtonFeedback = useCallback((buttonKey: string, type: "copy" | "paste") => {
    setButtonStates((prev) => ({
      ...prev,
      [buttonKey]: { showCheck: true, type },
    }))

    setTimeout(() => {
      setButtonStates((prev) => ({
        ...prev,
        [buttonKey]: { showCheck: false, type },
      }))
    }, 800)
  }, [])

  const copyDayData = useCallback(
    (monthId: string, weekId: string, dayIndex: number, sourceDate: string) => {
      const month = monthsData.find((m) => m.id === monthId)
      const week = month?.weeks.find((w) => w.id === weekId)
      const day = week?.days[dayIndex]

      if (day && day.todos.length > 0) {
        setCopiedDayData({
          todos: day.todos,
          sourceDate: sourceDate,
        })

        const buttonKey = `copy-${monthId}-${weekId}-${dayIndex}`
        showButtonFeedback(buttonKey, "copy")
      }
    },
    [monthsData, showButtonFeedback],
  )

  const pasteDayData = useCallback(
    (monthId: string, weekId: string, dayIndex: number, targetDate: string) => {
      if (!copiedDayData) return

      const month = monthsData.find((m) => m.id === monthId)
      const week = month?.weeks.find((w) => w.id === weekId)
      const day = week?.days[dayIndex]

      if (day && day.todos.length > 0) {
        setPasteTarget({ monthId, weekId, dayIndex, targetDate })
        setShowPasteConfirm(true)
        return
      }

      executePaste(monthId, weekId, dayIndex)
    },
    [copiedDayData, monthsData],
  )

  const executePaste = useCallback(
    (monthId: string, weekId: string, dayIndex: number) => {
      if (!copiedDayData) return

      const newTodos = copiedDayData.todos.map((todo) => ({
        ...todo,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }))

      setMonthsData((prev) =>
        prev.map((month) => {
          if (month.id === monthId) {
            return {
              ...month,
              weeks: month.weeks.map((week) => {
                if (week.id === weekId) {
                  return {
                    ...week,
                    days: week.days.map((day, idx) => {
                      if (idx === dayIndex) {
                        return {
                          ...day,
                          todos: newTodos,
                        }
                      }
                      return day
                    }),
                  }
                }
                return week
              }),
            }
          }
          return month
        }),
      )

      const buttonKey = `paste-${monthId}-${weekId}-${dayIndex}`
      showButtonFeedback(buttonKey, "paste")
    },
    [copiedDayData, setMonthsData, showButtonFeedback],
  )

  // Memoize other handlers
  const saveGistConfig = useCallback(async () => {
    if (!gistConfig.githubGistId || !gistConfig.githubToken) {
      alert("Please enter both Gist ID and Token")
      return
    }

    localStorage.setItem("gist-config", JSON.stringify(gistConfig))
    setIsConfigOpen(false)

    if (!isDataEmpty) {
      setShowFetchConfirm(true)
    } else {
      try {
        await fetchFromRemote()
      } catch (err) {
        console.error("Auto-fetch after config save failed:", err)
        setIsConfigOpen(true)
      }
    }
  }, [gistConfig, isDataEmpty, fetchFromRemote])

  const handleFetchClick = useCallback(() => {
    if (!gistConfig.githubGistId) {
      setIsConfigOpen(true)
      return
    }

    if (!isDataEmpty) {
      setShowFetchConfirm(true)
    } else {
      handleFetchConfirm()
    }
  }, [gistConfig.githubGistId, isDataEmpty])

  const handleFetchConfirm = useCallback(async () => {
    setShowFetchConfirm(false)
    try {
      await fetchFromRemote()
    } catch (err) {
      console.error("Fetch failed:", err)
    }
  }, [fetchFromRemote])

  const handleSaveClick = useCallback(() => {
    if (!gistConfig.githubGistId || !gistConfig.githubToken) {
      setIsConfigOpen(true)
      return
    }
    setShowSaveDialog(true)
  }, [gistConfig])

  const handleSaveAction = useCallback(
    async (action: "save" | "save-download") => {
      setShowSaveDialog(false)
      try {
        await saveToRemote(action === "save-download")
      } catch (err) {
        console.error("Save failed:", err)
      }
    },
    [saveToRemote],
  )

  const openEditPanel = useCallback((todo: TodoItem) => {
    setSelectedTodo(todo)
    setIsEditPanelOpen(true)
  }, [])

  const saveSelectedTodo = useCallback(() => {
    if (selectedTodo && selectedMonth && selectedWeek) {
      const month = monthsData.find((m) => m.id === selectedMonth)
      const week = month?.weeks.find((w) => w.id === selectedWeek)

      if (week) {
        week.days.forEach((day, dayIndex) => {
          const todoIndex = day.todos.findIndex((t) => t.id === selectedTodo.id)
          if (todoIndex !== -1) {
            updateTodo(selectedMonth, selectedWeek, dayIndex, selectedTodo.id, selectedTodo)
          }
        })
      }
    }
    setIsEditPanelOpen(false)
  }, [selectedTodo, selectedMonth, selectedWeek, monthsData, updateTodo])

  const handlePasteConfirm = useCallback(() => {
    if (pasteTarget) {
      executePaste(pasteTarget.monthId, pasteTarget.weekId, pasteTarget.dayIndex)
    }
    setShowPasteConfirm(false)
    setPasteTarget(null)
  }, [pasteTarget, executePaste])

  // Memoize status indicator
  const statusIndicator = useMemo(() => {
    if (!debouncedGistConfig.githubGistId || !debouncedGistConfig.githubToken) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground status-indicator">
          <AlertCircle className="h-4 w-4" />
          <span>Not configured</span>
        </div>
      )
    }

    if (isLoading) {
      return (
        <div className="flex items-center gap-2 text-sm text-primary status-indicator">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      )
    }

    if (!hasInitialFetch) {
      return (
        <div className="flex items-center gap-2 text-sm text-amber-500 status-indicator">
          <AlertCircle className="h-4 w-4" />
          <span>Fetch required</span>
        </div>
      )
    }

    if (hasInitialFetch && !changesSinceLastFetch) {
      return (
        <div className="flex items-center gap-2 text-sm text-green-500 status-indicator">
          <CheckCircle className="h-4 w-4" />
          <span>Up to date</span>
        </div>
      )
    }

    if (hasUnsavedChanges) {
      return (
        <div className="flex items-center gap-2 text-sm text-primary status-indicator tactical-glow">
          <AlertCircle className="h-4 w-4" />
          <span>Unsaved changes</span>
        </div>
      )
    }

    return lastSaved ? (
      <div className="flex items-center gap-2 text-sm text-green-500 status-indicator">
        <CheckCircle className="h-4 w-4" />
        <span>Saved {lastSaved.toLocaleTimeString()}</span>
      </div>
    ) : (
      <div className="flex items-center gap-2 text-sm text-muted-foreground status-indicator">
        <Save className="h-4 w-4" />
        <span>Ready to sync</span>
      </div>
    )
  }, [debouncedGistConfig, isLoading, hasInitialFetch, changesSinceLastFetch, hasUnsavedChanges, lastSaved])

  // Get current month and week data
  const currentMonth = useMemo(() => monthsData.find((m) => m.id === selectedMonth), [monthsData, selectedMonth])
  const currentWeek = useMemo(
    () => currentMonth?.weeks.find((w) => w.id === selectedWeek),
    [currentMonth, selectedWeek],
  )

  return (
    <div className="min-h-screen bg-background transition-colors">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Header */}
        
        <div className="mb-6 lg:mb-8 flex flex-col gap-6 w-full">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4 w-full">
            {/* Title + Description */}
            <div className="text-center lg:text-left">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">Productivity Tracker</h1>
              <p className="text-muted-foreground">Track your tasks and progress across July - October</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center lg:justify-end items-center gap-4">
              
              {/* Motivation */}
              <Button
                onClick={() => setShowMotivationModal(true)}
                className="bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 text-white font-medium px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Motivation
              </Button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Fetch Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleFetchClick}
                      disabled={!gistConfig.githubGistId || isLoading}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2 rounded-xl px-4 py-2 h-10 text-primary border-primary/30 hover:border-primary/50 hover:bg-primary/10 disabled:opacity-50"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline font-medium">Fetch</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {!gistConfig.githubGistId
                        ? "Configure GitHub Gist to enable fetching"
                        : "Fetch latest data from GitHub Gist (overwrites local data)"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Save Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleSaveClick}
                      disabled={isSaveDisabled}
                      size="sm"
                      variant="outline"
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 h-10 text-primary border-primary/30 hover:border-primary/50 hover:bg-primary/10 ${hasUnsavedChanges ? "tactical-glow border-primary/50 bg-primary/5" : ""
                        } ${isSaveDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <Save className="h-4 w-4" />
                      <span className="hidden sm:inline font-medium">Save & Download</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {!gistConfig.githubGistId || !gistConfig.githubToken
                        ? "Configure GitHub Gist to enable saving"
                        : !hasInitialFetch
                          ? "Must fetch from Gist first before saving"
                          : !changesSinceLastFetch
                            ? "No changes made since last fetch - modify some data first"
                            : "Save to GitHub Gist and download backup file"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Config Button */}
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 rounded-xl px-4 py-2 h-10 text-primary border-primary/30 hover:border-primary/50 hover:bg-primary/10"
                onClick={() => setIsConfigOpen(true)}
              >
                <Menu className="h-4 w-4" />
                <Github className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Status & Alerts Section */}
          <div className="flex flex-col items-center w-full gap-2">
            {/* Status Indicator */}
            <div className="hidden sm:block">{statusIndicator}</div>
            <div className="sm:hidden mb-4">{statusIndicator}</div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="w-full alert-enhanced rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {/* Unsaved Changes Alert */}
            {hasUnsavedChanges && (
              <Alert className="w-full border-primary/30 bg-primary/5 alert-enhanced rounded-xl tactical-glow">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-foreground">
                  You have unsaved changes. Don't forget to save your work to GitHub Gist.
                </AlertDescription>
              </Alert>
            )}

            {/* No Initial Fetch Warning */}
            {isConfigured && !hasInitialFetch && (
              <Alert className="w-full border-amber-500/30 bg-amber-500/5 alert-enhanced rounded-xl">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-foreground">
                  Credentials configured but no initial fetch performed. Click "Fetch" or "Save Configuration" to sync with your Gist.
                </AlertDescription>
              </Alert>
            )}

            {/* No Changes Since Fetch */}
            {hasInitialFetch && !changesSinceLastFetch && isConfigured && (
              <Alert className="w-full border-green-500/30 bg-green-500/5 alert-enhanced rounded-xl">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-foreground">
                  Data is up to date with your Gist. Make some changes to enable saving.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden enhanced-card">
          <Tabs value={selectedMonth} onValueChange={setSelectedMonth} className="w-full">
            <div className="border-b border-border bg-muted/30">
              <TabsList className="grid w-full grid-cols-4 h-14 bg-transparent p-1 rounded-none">
                {monthsData.map((month) => (
                  <TabsTrigger
                    key={month.id}
                    value={month.id}
                    className="flex items-center gap-2 h-full rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-foreground hover:text-primary transition-all duration-200 font-medium"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>{month.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {currentMonth && (
              <TabsContent value={currentMonth.id} className="p-4 lg:p-6 space-y-6">
                <Tabs value={selectedWeek} onValueChange={setSelectedWeek} className="w-full">
                  <div className="bg-muted/30 rounded-xl p-1 mb-6">
                    <TabsList
                      className="grid w-full h-12 bg-transparent p-0"
                      style={{ gridTemplateColumns: `repeat(${currentMonth.weeks.length}, 1fr)` }}
                    >
                      {currentMonth.weeks.map((week) => (
                        <TabsTrigger
                          key={week.id}
                          value={week.id}
                          className="h-10 rounded-lg data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm font-medium text-foreground hover:text-primary transition-all duration-200"
                        >
                          {week.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {currentWeek && (
                    <TabsContent value={currentWeek.id} className="space-y-6">
                      {/* Days Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold text-foreground">Daily Tasks</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-7 gap-4">
                          {currentWeek.days.map((day, dayIndex) => {
                            const canCopy = day.todos.length > 0
                            const canPaste = !!copiedDayData
                            const copyButtonKey = `copy-${currentMonth.id}-${currentWeek.id}-${dayIndex}`
                            const pasteButtonKey = `paste-${currentMonth.id}-${currentWeek.id}-${dayIndex}`

                            return (
                              <DayCard
                                key={`${currentWeek.id}-${dayIndex}`}
                                day={day}
                                dayIndex={dayIndex}
                                monthId={currentMonth.id}
                                weekId={currentWeek.id}
                                onAddTodo={() => addNewTodo(currentMonth.id, currentWeek.id, dayIndex)}
                                onUpdateTodo={(todoId, updates) =>
                                  updateTodo(currentMonth.id, currentWeek.id, dayIndex, todoId, updates)
                                }
                                onDeleteTodo={(todoId) => deleteTodo(currentMonth.id, currentWeek.id, dayIndex, todoId)}
                                onEditTodo={openEditPanel}
                                onCopy={() => copyDayData(currentMonth.id, currentWeek.id, dayIndex, day.fullDate)}
                                onPaste={() => pasteDayData(currentMonth.id, currentWeek.id, dayIndex, day.fullDate)}
                                canCopy={canCopy}
                                canPaste={canPaste}
                                copyButtonState={buttonStates[copyButtonKey]}
                                pasteButtonState={buttonStates[pasteButtonKey]}
                                copiedDayData={copiedDayData}
                              />
                            )
                          })}
                        </div>
                      </div>

                      {/* Weekly Notes Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold text-foreground">Weekly Notes</h3>
                        </div>

                        <Card className="rounded-xl">
                          <CardContent>
                            {/* <SimpleRichEditor
                              value={currentMonth.weeklyNotes[currentWeek.id] || ""}
                              onChange={(value) => updateWeeklyNotes(currentMonth.id, currentWeek.id, value)}
                              placeholder="Write your weekly summary, reflections, and notes here..."
                            /> */}
                            <SimpleRichEditor
                              value={currentMonth.weeklyNotes[currentWeek.id] || ""}
                              onChange={(value) => updateWeeklyNotes(currentMonth.id, currentWeek.id, value)}
                              placeholder="Write your weekly summary, reflections, and notes here..."
                            />
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* All the dialogs and modals remain the same but are omitted for brevity */}
        {/* ... (keeping all existing dialogs) ... */}

        {/* Fetch Confirmation Dialog */}
        <AlertDialog open={showFetchConfirm} onOpenChange={setShowFetchConfirm}>
          <AlertDialogContent className="sm:max-w-md bg-card border-border rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-foreground">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Overwrite Local Changes?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground">
                You have existing local data. Fetching from GitHub Gist will overwrite all your current local changes.
                This action cannot be undone.
                <br />
                <br />
                Are you sure you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-foreground rounded-lg">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleFetchConfirm} className="bg-amber-500 hover:bg-amber-600 rounded-lg">
                Proceed & Overwrite
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Save Options Dialog */}
        <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <AlertDialogContent className="sm:max-w-md bg-card border-border rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-foreground">
                <Save className="h-5 w-5 text-primary" />
                Save Options
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground">
                Choose how you want to save your data:
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-col gap-2">
              <AlertDialogAction
                onClick={() => handleSaveAction("save-download")}
                className="w-full bg-primary hover:bg-primary/90 rounded-lg primary-bg-text"
              >
                Save to Gist & Download File
              </AlertDialogAction>
              <AlertDialogAction
                onClick={() => handleSaveAction("save")}
                className="w-full text-foreground border-border hover:bg-accent rounded-lg"
              >
                Save to Gist Only
              </AlertDialogAction>
              <AlertDialogCancel className="w-full text-foreground rounded-lg">Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* GitHub Gist Config Sheet */}
        <Sheet open={isConfigOpen} onOpenChange={setIsConfigOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto bg-card border-border">
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Github className="h-5 w-5 text-primary" />
                GitHub Gist Configuration
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-4">
              {error && (
                <Alert variant="destructive" className="alert-enhanced rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="gist-id" className="text-sm font-medium text-foreground">
                    Gist ID
                  </Label>
                  <Input
                    id="gist-id"
                    placeholder="abc123def456..."
                    value={gistConfig.githubGistId}
                    onChange={(e) => setGistConfig({ ...gistConfig, githubGistId: e.target.value })}
                    className="text-sm bg-background border-border text-foreground rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="github-token" className="text-sm font-medium text-foreground">
                    Token (Required for saving)
                  </Label>
                  <Input
                    id="github-token"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxx"
                    value={gistConfig.githubToken}
                    onChange={(e) => setGistConfig({ ...gistConfig, githubToken: e.target.value })}
                    className="text-sm bg-background border-border text-foreground rounded-lg"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={saveGistConfig}
                    size="sm"
                    className="flex-1 bg-primary hover:bg-primary/90 rounded-lg primary-bg-text"
                    disabled={isLoading || !gistConfig.githubGistId || !gistConfig.githubToken}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Saving & Fetching...
                      </>
                    ) : (
                      "Save Configuration"
                    )}
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
                  <p>
                    • <strong>Required Flow:</strong> Enter credentials → Save Configuration → Fetch/Save data
                  </p>
                  <p>• Save button disabled until you fetch first, then make changes</p>
                  <p>• Fetch always overwrites local data with Gist data</p>
                  <p>• Create Gist at gist.github.com</p>
                  <p>• Token required for saving (Settings → Developer settings → Personal access tokens)</p>
                  <p>• Copy Gist ID from URL after creation</p>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Edit Todo Side Panel */}
        <Sheet open={isEditPanelOpen} onOpenChange={setIsEditPanelOpen}>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card border-border">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-lg font-semibold text-foreground">Edit Task Details</SheetTitle>
            </SheetHeader>

            {selectedTodo && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="task-text" className="text-sm font-medium text-foreground">
                    Task Name
                  </Label>
                  <Input
                    id="task-text"
                    value={selectedTodo.text}
                    onChange={(e) => setSelectedTodo({ ...selectedTodo, text: e.target.value })}
                    className="w-full bg-background border-border text-foreground rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-time" className="text-sm font-medium text-foreground">
                    Scheduled Time
                  </Label>
                  <Select
                    value={selectedTodo.time}
                    onValueChange={(value) => setSelectedTodo({ ...selectedTodo, time: value })}
                  >
                    <SelectTrigger className="w-full bg-background border-border text-foreground rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border rounded-lg">
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i === 0 ? 12 : i > 12 ? i - 12 : i
                        const ampm = i < 12 ? "AM" : "PM"
                        const time = `${hour}:00 ${ampm}`
                        return (
                          <SelectItem key={i} value={time} className="text-foreground">
                            {time}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-url" className="text-sm font-medium text-foreground">
                    Related URL
                  </Label>
                  <Textarea
                    id="task-url"
                    placeholder="Enter multiple URLs separated by space, comma, or new line"
                    value={selectedTodo.url || ""}
                    onChange={(e) => setSelectedTodo({ ...selectedTodo, url: e.target.value })}
                    className="w-full resize-none min-h-[100px] bg-background border-border text-foreground rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Notes</Label>
                  <div className="border border-border rounded-lg">
                    <SimpleRichEditor
                      value={selectedTodo.notes || ""}
                      onChange={(value) => setSelectedTodo({ ...selectedTodo, notes: value })}
                      placeholder="Add detailed notes, code snippets, or any additional information..."
                      compact
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button
                    onClick={saveSelectedTodo}
                    className="flex-1 bg-primary hover:bg-primary/90 rounded-lg primary-bg-text"
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditPanelOpen(false)}
                    className="flex-1 text-foreground border-border hover:bg-accent rounded-lg"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Motivation Modal */}
        {showMotivationModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowMotivationModal(false)}
          >
            <div
              className="bg-card rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    Daily Motivation
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMotivationModal(false)}
                    className="text-muted-foreground hover:text-foreground rounded-lg"
                  >
                    ✕
                  </Button>
                </div>

                <div className="aspect-video w-full">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/fzqqh5LLn_c?si=FM3qhisarait-i36&autoplay=1"
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="rounded-xl"
                  />
                </div>

                <div className="mt-4 text-center">
                  <p className="text-muted-foreground text-sm">Take a moment to get inspired and motivated! 🚀</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Paste Confirmation Dialog */}
        <AlertDialog open={showPasteConfirm} onOpenChange={setShowPasteConfirm}>
          <AlertDialogContent className="sm:max-w-md bg-card border-border rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-foreground">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Overwrite Existing Tasks?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground">
                {pasteTarget && (
                  <>
                    You are about to paste {copiedDayData?.todos.length} task(s) from{" "}
                    <strong>{copiedDayData?.sourceDate}</strong> to <strong>{pasteTarget.targetDate}</strong>.
                    <br />
                    <br />
                    This will replace all existing tasks in the target day. This action cannot be undone.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-foreground rounded-lg">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handlePasteConfirm} className="bg-amber-500 hover:bg-amber-600 rounded-lg">
                Overwrite Tasks
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
