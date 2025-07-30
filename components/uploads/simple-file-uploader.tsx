"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileSpreadsheet, Upload } from "lucide-react"

interface SimpleFileUploaderProps {
  onFileSelect: (file: File) => void
  selectedFile?: File | null
}

export function SimpleFileUploader({ onFileSelect, selectedFile }: SimpleFileUploaderProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="file"
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {selectedFile ? (
                <>
                  <FileSpreadsheet className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">{selectedFile.name}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">CSV, XLSX, or JSON (MAX. 10MB)</p>
                </>
              )}
            </div>
            <Input 
              id="file" 
              type="file" 
              accept=".csv,.xlsx,.json" 
              className="hidden" 
              onChange={handleFileChange} 
            />
          </label>
        </div>
      </CardContent>
    </Card>
  )
}
