"use client"

import { useCallback } from "react"

export function useDataBackup() {
  const exportData = useCallback(() => {
    try {
      const data = localStorage.getItem("productivity-tracker-data")
      if (!data) {
        alert("No data to export")
        return
      }

      const blob = new Blob([data], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `productivity-tracker-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
      alert("Export failed. Please try again.")
    }
  }, [])

  const importData = useCallback((file: File) => {
    return new Promise<boolean>((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const data = JSON.parse(content)

          // Validate data structure (basic check)
          if (data && Array.isArray(data) && data.length > 0) {
            localStorage.setItem("productivity-tracker-data", content)
            alert("Data imported successfully! Please refresh the page.")
            resolve(true)
          } else {
            alert("Invalid backup file format")
            resolve(false)
          }
        } catch (error) {
          console.error("Import failed:", error)
          alert("Import failed. Please check the file format.")
          resolve(false)
        }
      }
      reader.readAsText(file)
    })
  }, [])

  const clearAllData = useCallback(() => {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      localStorage.removeItem("productivity-tracker-data")
      alert("All data cleared. Please refresh the page.")
    }
  }, [])

  return { exportData, importData, clearAllData }
}
