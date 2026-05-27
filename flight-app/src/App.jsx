import { useState, useEffect } from 'react'
import { flightService } from './services/flightService'
import { Plane, Search, Trash2, PlusCircle, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'

export default function App() {
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    code: '',
    carrier: '',
    source: '',
    destination: '',
    cost: ''
  })

  const [searchTab, setSearchTab] = useState('all')
  const [searchCode, setSearchCode] = useState('')
  const [searchCarrier, setSearchCarrier] = useState('')
  const [searchRoute, setSearchRoute] = useState({ source: '', destination: '' })
  const [searchPrice, setSearchPrice] = useState({ min: '', max: '' })

  const loadAllFlights = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await flightService.list()
      setFlights(data)
    } catch (err) {
      setError('Could not connect to the backend server. Please verify if the Spring Boot service is active.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllFlights()
  }, [])

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const codeRegex = /^[A-Z]{2}-\d{3,4}$/
    if (!codeRegex.test(form.code)) {
      setError('Flight code must match format XX-123 or XX-1234 (e.g. AI-101 or AA-1234)')
      return
    }
    const costVal = parseFloat(form.cost)
    if (isNaN(costVal) || costVal <= 0) {
      setError('Ticket cost must be a positive number')
      return
    }

    try {
      await flightService.save({ ...form, cost: costVal })
      setSuccess('Flight registered successfully!')
      setForm({ code: '', carrier: '', source: '', destination: '', cost: '' })
      loadAllFlights()
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message)
      } else {
        setError('Failed to register flight. Please check if the flight code is already registered.')
      }
    }
  }

  const handleSearchSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let data = []
      if (searchTab === 'all') {
        data = await flightService.list()
      } else if (searchTab === 'code') {
        if (!searchCode.trim()) {
          setError('Please enter a flight code')
          setLoading(false)
          return
        }
        try {
          const single = await flightService.findByCode(searchCode.trim())
          data = single ? [single] : []
        } catch (err) {
          if (err.response && err.response.status === 404) {
            data = []
          } else {
            throw err
          }
        }
      } else if (searchTab === 'carrier') {
        if (!searchCarrier.trim()) {
          setError('Please enter a carrier name')
          setLoading(false)
          return
        }
        data = await flightService.findByCarrier(searchCarrier.trim())
      } else if (searchTab === 'route') {
        if (!searchRoute.source.trim() || !searchRoute.destination.trim()) {
          setError('Both source and destination routes are required')
          setLoading(false)
          return
        }
        data = await flightService.findByRoute(searchRoute.source.trim(), searchRoute.destination.trim())
      } else if (searchTab === 'price') {
        const minVal = parseFloat(searchPrice.min)
        const maxVal = parseFloat(searchPrice.max)
        if (isNaN(minVal) || isNaN(maxVal) || minVal < 0 || maxVal < 0) {
          setError('Minimum and maximum ticket prices must be positive numbers')
          setLoading(false)
          return
        }
        if (minVal > maxVal) {
          setError('Minimum price cannot be greater than maximum price')
          setLoading(false)
          return
        }
        data = await flightService.findByPriceRange(minVal, maxVal)
      }
      setFlights(data)
    } catch (err) {
      setError('An error occurred while performing search query operations.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (code) => {
    if (!window.confirm(`Are you sure you want to delete flight ${code}?`)) return
    setError('')
    try {
      await flightService.deleteFlight(code)
      setFlights((prev) => prev.filter((f) => f.code !== code))
      setSuccess(`Flight ${code} was successfully deleted!`)
    } catch (err) {
      setError(`Failed to delete flight ${code}`)
    }
  }

  const handleResetSearch = () => {
    setSearchCode('')
    setSearchCarrier('')
    setSearchRoute({ source: '', destination: '' })
    setSearchPrice({ min: '', max: '' })
    loadAllFlights()
  }

  return (
    <div class="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      <header class="bg-indigo-600 text-white shadow-md">
        <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="p-2 bg-indigo-500 rounded-lg">
              <Plane class="w-6 h-6 rotate-45" />
            </div>
            <span class="text-xl font-bold tracking-tight">AeroFlow Control</span>
          </div>
          <button
            onClick={loadAllFlights}
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-sm font-semibold transition-all"
          >
            <RefreshCw class="w-4 h-4" />
            <span>Refresh Logs</span>
          </button>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {error && (
          <div class="flex items-start gap-2.5 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm shadow-sm">
            <AlertCircle class="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div class="flex items-start gap-2.5 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm shadow-sm">
            <CheckCircle class="w-5 h-5 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-fit">
            <div class="flex items-center gap-2 mb-4">
              <PlusCircle class="w-5 h-5 text-indigo-600" />
              <h2 class="text-lg font-bold text-slate-900">Add New Flight</h2>
            </div>
            
            <form onSubmit={handleAddSubmit} class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Flight Code</label>
                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleFormChange}
                  placeholder="e.g. AI-101"
                  class="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Airline / Carrier</label>
                <input
                  type="text"
                  name="carrier"
                  value={form.carrier}
                  onChange={handleFormChange}
                  placeholder="e.g. Air India"
                  class="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Source</label>
                  <input
                    type="text"
                    name="source"
                    value={form.source}
                    onChange={handleFormChange}
                    placeholder="e.g. Nagpur"
                    class="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Destination</label>
                  <input
                    type="text"
                    name="destination"
                    value={form.destination}
                    onChange={handleFormChange}
                    placeholder="e.g. Pune"
                    class="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Ticket Price (INR)</label>
                <input
                  type="number"
                  name="cost"
                  value={form.cost}
                  onChange={handleFormChange}
                  placeholder="e.g. 3500"
                  step="0.01"
                  class="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <button
                type="submit"
                class="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-sm shadow-indigo-600/10"
              >
                Save Flight Path
              </button>
            </form>
          </div>

          <div class="lg:col-span-2 space-y-6">
            <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Search class="w-4.5 h-4.5 text-slate-500" />
                <h3 class="text-sm font-bold text-slate-900">Advanced Filter Console</h3>
              </div>

              <div class="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'All Flights' },
                  { id: 'code', label: 'By Code' },
                  { id: 'carrier', label: 'By Carrier' },
                  { id: 'route', label: 'By Route' },
                  { id: 'price', label: 'By Price' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSearchTab(tab.id)
                      setError('')
                    }}
                    class={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      searchTab === tab.id
                        ? 'bg-slate-100 text-indigo-700 border border-indigo-200'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSearchSubmit} class="flex flex-col sm:flex-row sm:items-end gap-4">
                <div class="flex-grow">
                  {searchTab === 'all' && (
                    <p class="text-xs text-slate-400 mt-1">Queries the entire active flight control roster.</p>
                  )}

                  {searchTab === 'code' && (
                    <input
                      type="text"
                      value={searchCode}
                      onChange={(e) => setSearchCode(e.target.value)}
                      placeholder="Enter exact Flight Code (e.g. AI-101)"
                      class="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm focus:border-indigo-500"
                      required
                    />
                  )}

                  {searchTab === 'carrier' && (
                    <input
                      type="text"
                      value={searchCarrier}
                      onChange={(e) => setSearchCarrier(e.target.value)}
                      placeholder="Enter Carrier Name (e.g. Air India)"
                      class="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm focus:border-indigo-500"
                      required
                    />
                  )}

                  {searchTab === 'route' && (
                    <div class="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={searchRoute.source}
                        onChange={(e) => setSearchRoute((prev) => ({ ...prev, source: e.target.value }))}
                        placeholder="Source (Nagpur)"
                        class="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm focus:border-indigo-500"
                        required
                      />
                      <input
                        type="text"
                        value={searchRoute.destination}
                        onChange={(e) => setSearchRoute((prev) => ({ ...prev, destination: e.target.value }))}
                        placeholder="Destination (Pune)"
                        class="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm focus:border-indigo-500"
                        required
                      />
                    </div>
                  )}

                  {searchTab === 'price' && (
                    <div class="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={searchPrice.min}
                        onChange={(e) => setSearchPrice((prev) => ({ ...prev, min: e.target.value }))}
                        placeholder="Min Price (e.g. 1000)"
                        class="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm focus:border-indigo-500"
                        required
                      />
                      <input
                        type="number"
                        value={searchPrice.max}
                        onChange={(e) => setSearchPrice((prev) => ({ ...prev, max: e.target.value }))}
                        placeholder="Max Price (e.g. 5000)"
                        class="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm focus:border-indigo-500"
                        required
                      />
                    </div>
                  )}
                </div>

                <div class="flex gap-2">
                  <button
                    type="submit"
                    class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all"
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSearch}
                    class="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-all border border-slate-200"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>

            <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 class="text-sm font-bold text-slate-900">Flight Logs ({flights.length})</h3>
              </div>

              {loading ? (
                <div class="py-12 text-center text-slate-400 text-sm">Loading flights...</div>
              ) : flights.length === 0 ? (
                <div class="py-16 text-center">
                  <Plane class="w-8 h-8 text-slate-300 mx-auto rotate-45 mb-2.5" />
                  <p class="text-slate-500 text-sm font-semibold">No flight records found</p>
                </div>
              ) : (
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="border-b border-slate-100 text-xxs font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50/20">
                        <th class="px-6 py-3">Code</th>
                        <th class="px-6 py-3">Airline</th>
                        <th class="px-6 py-3">Route</th>
                        <th class="px-6 py-3">Ticket Price</th>
                        <th class="px-6 py-3 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-sm text-slate-700">
                      {flights.map((flight) => (
                        <tr key={flight.id} class="hover:bg-slate-50/50 transition-all">
                          <td class="px-6 py-3.5">
                            <span class="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                              {flight.code}
                            </span>
                          </td>
                          <td class="px-6 py-3.5 font-medium text-slate-900">{flight.carrier}</td>
                          <td class="px-6 py-3.5">
                            <div class="flex items-center gap-1.5">
                              <span class="font-semibold text-slate-800">{flight.source}</span>
                              <span class="text-slate-400 text-xs">➔</span>
                              <span class="font-semibold text-slate-800">{flight.destination}</span>
                            </div>
                          </td>
                          <td class="px-6 py-3.5 font-bold text-slate-800">₹{flight.cost.toLocaleString('en-IN')}</td>
                          <td class="px-6 py-3.5 text-right">
                            <button
                              onClick={() => handleDelete(flight.code)}
                              class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                            >
                              <Trash2 class="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
