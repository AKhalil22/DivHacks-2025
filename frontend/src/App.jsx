import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

const API_BASE = 'http://localhost:8000'

function App() {
  const [prompts, setPrompts] = useState([])
  const [newPromptText, setNewPromptText] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    fetchPrompts()
  }, [])

  const fetchPrompts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/prompts`)
      setPrompts(response.data)
    } catch (error) {
      console.error('Error fetching prompts:', error)
    }
  }

  const createPrompt = async () => {
    if (!newPromptText.trim()) return
    try {
      await axios.post(`${API_BASE}/prompts`, { text: newPromptText })
      setNewPromptText('')
      fetchPrompts()
    } catch (error) {
      console.error('Error creating prompt:', error)
    }
  }

  const updatePrompt = async (id) => {
    if (!editText.trim()) return
    try {
      await axios.put(`${API_BASE}/prompts/${id}`, { text: editText, response: prompts.find(p => p.id === id).response })
      setEditingId(null)
      setEditText('')
      fetchPrompts()
    } catch (error) {
      console.error('Error updating prompt:', error)
    }
  }

  const deletePrompt = async (id) => {
    try {
      await axios.delete(`${API_BASE}/prompts/${id}`)
      fetchPrompts()
    } catch (error) {
      console.error('Error deleting prompt:', error)
    }
  }

  const generateResponse = async (id) => {
    try {
      await axios.post(`${API_BASE}/generate/${id}`)
      fetchPrompts()
    } catch (error) {
      console.error('Error generating response:', error)
    }
  }

  return (
    <div className="App">
      <h1>AI Prompt Manager</h1>
      <div className="create-form">
        <input
          type="text"
          value={newPromptText}
          onChange={(e) => setNewPromptText(e.target.value)}
          placeholder="Enter new prompt"
        />
        <button onClick={createPrompt}>Create Prompt</button>
      </div>
      <div className="prompts-list">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="prompt-item">
            {editingId === prompt.id ? (
              <div>
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                />
                <button onClick={() => updatePrompt(prompt.id)}>Save</button>
                <button onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            ) : (
              <div>
                <h3>Prompt: {prompt.text}</h3>
                <p>Response: {prompt.response}</p>
                <button onClick={() => { setEditingId(prompt.id); setEditText(prompt.text) }}>Edit</button>
                <button onClick={() => deletePrompt(prompt.id)}>Delete</button>
                <button onClick={() => generateResponse(prompt.id)}>Generate AI Response</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
