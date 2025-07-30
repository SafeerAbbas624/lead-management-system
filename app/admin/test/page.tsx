"use client"

export default function TestPage() {
  console.log('TestPage component rendered')
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Test Admin Page</h1>
      <p>If you can see this, the admin routing is working.</p>
      <p>Current time: {new Date().toISOString()}</p>
    </div>
  )
}
