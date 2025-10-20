/**
 * ThemeTab component
 * Theme selection and customization interface
 */

'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useThemeStore } from '@/lib/themes/stores'
import { themes } from '@/lib/themes/constants'
import { Moon, Sun, User, Layers } from 'lucide-react'

const themeIcons = {
  default: Layers,
  claude: User
}

export function ThemeTab() {
  const { currentTheme, isDarkMode, setTheme, toggleDarkMode } = useThemeStore()

  const handleThemeSelect = (themeId: string) => {
    setTheme(themeId)
  }

  const renderPreviewColors = (preview: { primary: string; secondary: string; background: string; foreground: string }) => {
    const colors = [preview.primary, preview.secondary, preview.background, preview.foreground]
    return (
      <div className="flex gap-1 mt-2">
        {colors.map((color, index) => (
          <div
            key={index}
            className="w-4 h-4 rounded-full border border-border/20"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Theme Selection
          </CardTitle>
          <CardDescription>
            Choose from our curated collection of professional themes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {themes.map((theme) => {
              const IconComponent = themeIcons[theme.id as keyof typeof themeIcons] || Layers
              const isSelected = currentTheme.id === theme.id
              
              return (
                <div
                  key={theme.id}
                  className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                    isSelected 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleThemeSelect(theme.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-md ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{theme.name}</h3>
                          {isSelected && (
                            <Badge variant="default" className="text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {theme.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>by {theme.author}</span>
                        </div>
                        {renderPreviewColors(theme.preview)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
