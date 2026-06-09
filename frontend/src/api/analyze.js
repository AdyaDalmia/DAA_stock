import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function analyzeStock(symbol) {
  const response = await axios.post(`${API_URL}/analyze`, { symbol })
  return response.data
}
