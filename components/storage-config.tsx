"use client"

import { useState } from "react"
import { Settings, Github, Database, Globe, Save, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface StorageConfigProps {
  onConfigSave: (config: any) => void
  onFetch: () => void
  onSave: () => void
  isLoading: boolean
  lastSaved: Date | null
  error: string | null
}

export function StorageConfig({ onConfigSave, onFetch, onSave, isLoading, lastSaved, error }: StorageConfigProps) {
  const [config, setConfig] = useState({
    githubGistId: "",
    githubToken: "",
    jsonbinId: "",
    jsonbinKey: "",
    customUrl: "",
  })

  const handleSaveConfig = () => {
    localStorage.setItem("storage-config", JSON.stringify(config))
    onConfigSave(config)
  }

  // Load saved config
  useState(() => {
    const saved = localStorage.getItem("storage-config")
    if (saved) {
      const parsedConfig = JSON.parse(saved)
      setConfig(parsedConfig)
      onConfigSave(parsedConfig)
    }
  })

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="h-5 w-5 text-slate-600" />
          Cloud Storage Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div>
            <div className="font-medium text-slate-900">Status</div>
            <div className="text-sm text-slate-600">
              {lastSaved ? `Last saved: ${lastSaved.toLocaleString()}` : "Not synced"}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onFetch}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Fetch
            </Button>
            <Button onClick={onSave} disabled={isLoading} size="sm" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>

        <Tabs defaultValue="github" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="github" className="flex items-center gap-2">
              <Github className="h-4 w-4" />
              GitHub Gist
            </TabsTrigger>
            <TabsTrigger value="jsonbin" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              JSONBin
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Custom URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="github" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gist-id">GitHub Gist ID</Label>
              <Input
                id="gist-id"
                placeholder="abc123def456..."
                value={config.githubGistId}
                onChange={(e) => setConfig({ ...config, githubGistId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github-token">GitHub Token (Optional)</Label>
              <Input
                id="github-token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                value={config.githubToken}
                onChange={(e) => setConfig({ ...config, githubToken: e.target.value })}
              />
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <p>1. Create a new Gist at gist.github.com</p>
              <p>2. Copy the Gist ID from the URL</p>
              <p>3. For private gists, create a token at github.com/settings/tokens</p>
            </div>
          </TabsContent>

          <TabsContent value="jsonbin" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jsonbin-id">JSONBin ID</Label>
              <Input
                id="jsonbin-id"
                placeholder="xxxxxxxxxxxxxxxxx"
                value={config.jsonbinId}
                onChange={(e) => setConfig({ ...config, jsonbinId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jsonbin-key">Master Key</Label>
              <Input
                id="jsonbin-key"
                type="password"
                placeholder="$2a$10$..."
                value={config.jsonbinKey}
                onChange={(e) => setConfig({ ...config, jsonbinKey: e.target.value })}
              />
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <p>1. Sign up at jsonbin.io (free tier available)</p>
              <p>2. Create a new bin and copy the ID</p>
              <p>3. Get your Master Key from the dashboard</p>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-url">JSON File URL</Label>
              <Input
                id="custom-url"
                placeholder="https://example.com/data.json"
                value={config.customUrl}
                onChange={(e) => setConfig({ ...config, customUrl: e.target.value })}
              />
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <p>• URL must return valid JSON</p>
              <p>• CORS must be enabled for browser access</p>
              <p>• Read-only (cannot save back to custom URLs)</p>
            </div>
          </TabsContent>
        </Tabs>

        <Button onClick={handleSaveConfig} className="w-full">
          Save Configuration
        </Button>
      </CardContent>
    </Card>
  )
}
