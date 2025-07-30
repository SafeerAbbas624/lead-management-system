"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tag, Plus, X } from "lucide-react"

interface LeadTaggingConfigProps {
  sessionId: string
  onConfigUpdate: (tags: string[]) => void
}

export function LeadTaggingConfig({ sessionId, onConfigUpdate }: LeadTaggingConfigProps) {
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    onConfigUpdate(tags)
  }, [tags, onConfigUpdate])

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Sheet Tags
          <Badge variant="outline">
            {tags.length} tags
          </Badge>
        </CardTitle>
        <CardDescription>
          Add tags that will be applied to all leads in this sheet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Tag */}
        <div className="space-y-4">
          <h4 className="font-medium">Add Tags for This Sheet</h4>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter tag name (e.g., high-value, california, Q1-2024)"
              className="flex-1"
            />
            <Button onClick={addTag} disabled={!newTag.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tag
            </Button>
          </div>
        </div>

        {/* Current Tags */}
        {tags.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Current Tags</h4>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="default" className="flex items-center gap-1">
                  {tag}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTag(tag)}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Tagging Summary</h4>
          <div className="text-sm space-y-1">
            {tags.length > 0 ? (
              <>
                <p>• {tags.length} tag(s) will be applied to all leads in this sheet</p>
                <p>• Tags: {tags.join(', ')}</p>
                <p>• Tags help with lead segmentation and filtering</p>
              </>
            ) : (
              <p>• No tags configured - leads will be uploaded without tags</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
