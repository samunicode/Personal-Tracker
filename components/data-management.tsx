"use client"

import type React from "react"

import { useRef } from "react"
import { Download, Upload, Trash2, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDataBackup } from "@/hooks/use-data-backup"

export function DataManagement() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { exportData, importData, clearAllData } = useDataBackup()

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await importData(file)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const getStorageInfo = () => {
    try {
      const data = localStorage.getItem("productivity-tracker-data")
      if (data) {
        const sizeInBytes = new Blob([data]).size
        const sizeInKB = (sizeInBytes / 1024).toFixed(2)
        const itemCount = JSON.parse(data).reduce((total: number, month: any) => {
          return (
            total +
            month.weeks.reduce((weekTotal: number, week: any) => {
              return (
                weekTotal +
                week.days.reduce((dayTotal: number, day: any) => {
                  return dayTotal + day.todos.length
                }, 0)
              )
            }, 0)
          )
        }, 0)
        return { size: sizeInKB, items: itemCount }
      }
    } catch (error) {
      console.error("Error getting storage info:", error)
    }
    return { size: "0", items: 0 }
  }

  const storageInfo = getStorageInfo()

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Database className="h-5 w-5 text-slate-600" />
          Data Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{storageInfo.items}</div>
            <div className="text-sm text-slate-600">Total Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{storageInfo.size} KB</div>
            <div className="text-sm text-slate-600">Storage Used</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            onClick={exportData}
            variant="outline"
            className="flex items-center gap-2 hover:bg-green-50 hover:border-green-300 bg-transparent"
          >
            <Download className="h-4 w-4" />
            Export Backup
          </Button>

          <div>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
            >
              <Upload className="h-4 w-4" />
              Import Backup
            </Button>
          </div>

          <Button
            onClick={clearAllData}
            variant="outline"
            className="flex items-center gap-2 hover:bg-red-50 hover:border-red-300 text-red-600 bg-transparent"
          >
            <Trash2 className="h-4 w-4" />
            Clear All Data
          </Button>
        </div>

        <div className="text-xs text-slate-500 space-y-1">
          <p>• Data is stored locally in your browser</p>
          <p>• Export backups regularly to prevent data loss</p>
          <p>• Clearing browser data will remove all tasks</p>
        </div>
      </CardContent>
    </Card>
  )
}
