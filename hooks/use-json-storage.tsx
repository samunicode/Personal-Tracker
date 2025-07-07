"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface JsonStorageConfig {
  githubGistId?: string
  githubToken?: string
}

export function useJsonStorage<T>(key: string, initialValue: T, config?: JsonStorageConfig) {
  const [data, setData] = useState<T>(initialValue)
  const [isLoading, setIsLoading] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)
  const [hasInitialFetch, setHasInitialFetch] = useState(false)
  const [changesSinceLastFetch, setChangesSinceLastFetch] = useState(false)
  const lastSaveDataRef = useRef<string>("")
  const lastFetchDataRef = useRef<string>("")
  const skipChangeDetectionRef = useRef(false)

  // Load from localStorage first (fallback)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsedData = JSON.parse(stored)
        setData(parsedData)
        lastSaveDataRef.current = stored
      }
    } catch (err) {
      console.error("Error loading from localStorage:", err)
    }
  }, [key])

  // Save to localStorage whenever data changes and track unsaved changes
  useEffect(() => {
    // Skip all change detection if flag is set
    if (skipChangeDetectionRef.current) {
      return
    }

    try {
      const dataString = JSON.stringify(data)
      localStorage.setItem(key, dataString)

      // Check if data has changed since last save to remote
      if (lastSaveDataRef.current && dataString !== lastSaveDataRef.current) {
        setHasUnsavedChanges(true)
      }

      // Only track changes if we've done an initial fetch
      // AND the current data is different from what we fetched
      if (hasInitialFetch && lastFetchDataRef.current && dataString !== lastFetchDataRef.current) {
        setChangesSinceLastFetch(true)
      } else if (hasInitialFetch && lastFetchDataRef.current && dataString === lastFetchDataRef.current) {
        // If data matches what we fetched, no changes since fetch
        setChangesSinceLastFetch(false)
      }
    } catch (err) {
      console.error("Error saving to localStorage:", err)
    }
  }, [key, data, hasInitialFetch])

  // Check if config is valid - but don't auto-connect
  useEffect(() => {
    const configValid = !!(config?.githubGistId && config?.githubToken)
    setIsConfigured(configValid)
  }, [config?.githubGistId, config?.githubToken])

  // Fetch from GitHub Gist
  const fetchFromRemote = useCallback(async () => {
    if (!config?.githubGistId) {
      setError("GitHub Gist ID is required")
      return
    }

    setIsLoading(true)
    setError(null)

    // Set flag to skip ALL change detection during fetch process
    skipChangeDetectionRef.current = true

    try {
      const url = `https://api.github.com/gists/${config.githubGistId}`
      const headers: Record<string, string> = {}

      if (config.githubToken) {
        headers.Authorization = `token ${config.githubToken}`
      }

      const response = await fetch(url, { headers })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Gist not found. Please check the Gist ID.")
        }
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      const files = result.files
      const firstFile = Object.values(files)[0] as any

      if (firstFile && firstFile.content) {
        const newData: T = JSON.parse(firstFile.content)

        // Update all references BEFORE setting data
        lastSaveDataRef.current = firstFile.content
        lastFetchDataRef.current = firstFile.content

        // Set data (this will trigger useEffect but it will be skipped due to flag)
        setData(newData)
        localStorage.setItem(key, JSON.stringify(newData))

        // Reset all change tracking flags
        setHasUnsavedChanges(false)
        setChangesSinceLastFetch(false)
        setHasInitialFetch(true)
        setError(null)

        console.log("Successfully fetched data from Gist - local data overwritten")
      } else {
        console.log("Gist exists but has no content")
        const currentDataString = JSON.stringify(data)
        lastFetchDataRef.current = currentDataString
        setChangesSinceLastFetch(false)
        setHasInitialFetch(true)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch data"
      setError(errorMessage)
      console.error("Error fetching from GitHub Gist:", err)
      throw err
    } finally {
      setIsLoading(false)
      // Clear the skip flag AFTER everything is complete
      // Use setTimeout to ensure all state updates have processed
      setTimeout(() => {
        skipChangeDetectionRef.current = false
      }, 100)
    }
  }, [config, key, data])

  // Save to GitHub Gist and download file
  const saveToRemote = useCallback(
    async (downloadFile = true) => {
      if (!config?.githubGistId) {
        setError("GitHub Gist ID is required")
        return
      }

      if (!config.githubToken) {
        setError("GitHub Token is required for saving")
        return
      }

      if (isLoading) {
        console.log("Save already in progress, skipping...")
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const dataToSave = JSON.stringify(data, null, 2)
        const url = `https://api.github.com/gists/${config.githubGistId}`

        const headers = {
          Authorization: `token ${config.githubToken}`,
          "Content-Type": "application/json",
        }

        const body = JSON.stringify({
          files: {
            "productivity-data.json": {
              content: dataToSave,
            },
          },
        })

        const response = await fetch(url, {
          method: "PATCH",
          headers,
          body,
        })

        if (!response.ok) {
          if (response.status === 409) {
            console.log("Conflict detected, fetching latest data...")
            await fetchFromRemote()
            throw new Error("Conflict detected. Latest data fetched. Please try saving again.")
          }
          throw new Error(`Failed to save: ${response.status} ${response.statusText}`)
        }

        lastSaveDataRef.current = dataToSave
        lastFetchDataRef.current = dataToSave
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
        setChangesSinceLastFetch(false)
        setError(null)
        console.log("Successfully saved to GitHub Gist")

        // Download the file if requested
        if (downloadFile) {
          const blob = new Blob([dataToSave], { type: "application/json" })
          const downloadUrl = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = downloadUrl
          link.download = `productivity-tracker-${new Date().toISOString().split("T")[0]}.json`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(downloadUrl)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to save data"
        setError(errorMessage)
        console.error("Error saving to GitHub Gist:", err)
      } finally {
        setIsLoading(false)
      }
    },
    [config, data, isLoading, fetchFromRemote],
  )

  return {
    data,
    setData,
    isLoading,
    lastSaved,
    error,
    hasUnsavedChanges,
    isConfigured,
    hasInitialFetch,
    changesSinceLastFetch,
    fetchFromRemote,
    saveToRemote,
  }
}
