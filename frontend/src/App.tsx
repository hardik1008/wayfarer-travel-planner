import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowDownUp, ArrowRight, ArrowUpRight, Bell, Bookmark, CalendarDays,
  Check, ChevronLeft, ChevronRight, CircleHelp, Compass, Copy,
  Ellipsis, Feather, Filter, Globe2, Heart, Hotel, LayoutDashboard,
  LogOut, MapPin, Menu, MoreHorizontal, Plus, Search, Settings, Sparkles,
  Ticket, Trash2, Users, Wallet, X,
} from 'lucide-react'

type Activity = { time: string; title: string; place: string; type: string; day: number; notes?: string; cost?: number }
type Trip = {
  id: number; name: string; description?: string; destinations: string[]; start: string; end: string;
  image: string; budget: number; spent: number; travellers: number; status: 'upcoming' | 'planning' | 'past';
  activities: Activity[]
}

const initialTrips: Trip[] = [
  {
    id: 1, name: 'Japan, at your own pace', destinations: ['Tokyo', 'Kyoto', 'Osaka'],
    start: '2026-11-10', end: '2026-11-18',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=85',
    budget: 150000, spent: 84700, travellers: 2, status: 'upcoming',
    activities: [
      { day: 1, time: '09:00', title: 'Coffee & breakfast', place: 'Fuglen Asakusa', type: 'Food' },
      { day: 1, time: '10:30', title: 'Wander through Senso-ji', place: 'Asakusa, Tokyo', type: 'Explore' },
      { day: 1, time: '13:00', title: 'Lunch in the old town', place: 'Daikokuya Tempura', type: 'Food' },
      { day: 1, time: '15:30', title: 'Sunset from Tokyo Skytree', place: 'Sumida, Tokyo', type: 'Explore' },
    ],
  },
  {
    id: 2, name: 'A little bit of Lisbon', destinations: ['Lisbon', 'Sintra'],
    start: '2027-03-14', end: '2027-03-20',
    image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1000&q=85',
    budget: 98000, spent: 28600, travellers: 2, status: 'planning',
    activities: [
      { day: 1, time: '09:30', title: 'Pastel de nata, obviously', place: 'Pastéis de Belém', type: 'Food' },
      { day: 1, time: '11:00', title: 'Ride the yellow tram', place: 'Alfama, Lisbon', type: 'Explore' },
    ],
  },
  {
    id: 3, name: 'Slow days in Copenhagen', destinations: ['Copenhagen'],
    start: '2026-08-05', end: '2026-08-10',
    image: 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1000&q=85',
    budget: 85000, spent: 79200, travellers: 1, status: 'past',
    activities: [
      { day: 1, time: '10:00', title: 'Pastries at Juno', place: 'Østerbro, Copenhagen', type: 'Food' },
      { day: 1, time: '13:00', title: 'A swim at Islands Brygge', place: 'Islands Brygge', type: 'Explore' },
    ],
  },
]

const recommendations = [
  { name: 'Kyoto after dark', category: 'A slower side of Japan', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=700&q=80', detail: '6 lovely experiences' },
  { name: 'A weekend in the mountains', category: 'Made for fresh air', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=700&q=80', detail: '8 places to save' },
  { name: 'The good things in Oaxaca', category: 'Eat your way around', image: 'https://images.unsplash.com/photo-1512813195386-6cf811ad3542?auto=format&fit=crop&w=700&q=80', detail: '12 local favourites' },
]

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'My trips', icon: MapPin },
  { label: 'Explore', icon: Compass },
  { label: 'Bookings', icon: Ticket },
  { label: 'Budget', icon: Wallet },
]
const navPaths: Record<string, string> = {
  Overview: '/',
  'My trips': '/trips',
  Explore: '/explore',
  Bookings: '/bookings',
  Budget: '/budget',
}
const navLabels = Object.fromEntries(Object.entries(navPaths).map(([label, path]) => [path, label]))

const formatMoney = (value: number) => `₹${new Intl.NumberFormat('en-IN').format(value)}`
const niceDate = (date: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
  new Intl.DateTimeFormat('en-IN', options).format(new Date(`${date}T12:00:00`))
const daysUntil = (date: string) => Math.max(0, Math.ceil((new Date(`${date}T12:00:00`).getTime() - Date.now()) / 86400000))
const dateRange = (trip: Trip) => `${niceDate(trip.start)} – ${niceDate(trip.end, { day: 'numeric', month: 'short', year: 'numeric' })}`

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [trips, setTrips] = useState<Trip[]>(() => {
    const saved = localStorage.getItem('wayfarer-trips')
    if (!saved) return initialTrips
    try {
      return JSON.parse(saved) as Trip[]
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error
      console.warn('Stored trip data was invalid; starting with the sample itinerary.')
      localStorage.removeItem('wayfarer-trips')
      return initialTrips
    }
  })
  const [activeNav, setActiveNav] = useState(() => navLabels[window.location.pathname] ?? 'Overview')
  const [query, setQuery] = useState('')
  const [tripFilter, setTripFilter] = useState<'all' | 'upcoming' | 'past'>('all')
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [modal, setModal] = useState<'create' | 'edit' | 'profile' | null>(null)
  const [menuTrip, setMenuTrip] = useState<number | null>(null)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [toast, setToast] = useState('')
  const [savedPlaces, setSavedPlaces] = useState<string[]>(() => {
    const saved = localStorage.getItem('wayfarer-places')
    if (!saved) return []
    try {
      return JSON.parse(saved) as string[]
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error
      console.warn('Stored saved places were invalid; starting with an empty collection.')
      localStorage.removeItem('wayfarer-places')
      return []
    }
  })

  useEffect(() => localStorage.setItem('wayfarer-trips', JSON.stringify(trips)), [trips])
  useEffect(() => localStorage.setItem('wayfarer-places', JSON.stringify(savedPlaces)), [savedPlaces])
  useEffect(() => {
    setActiveNav(navLabels[location.pathname] ?? 'Overview')
    setMobileMenu(false)
  }, [location.pathname])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const visibleTrips = useMemo(() => trips.filter((trip) => {
    const matchesQuery = `${trip.name} ${trip.destinations.join(' ')}`.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = tripFilter === 'all' || (tripFilter === 'past' ? trip.status === 'past' : trip.status !== 'past')
    return matchesQuery && matchesFilter
  }), [trips, query, tripFilter])
  const upcoming = trips.filter((trip) => trip.status !== 'past').sort((a, b) => a.start.localeCompare(b.start))
  const featuredTrip = upcoming[0]
  const totalBudget = trips.filter((trip) => trip.status !== 'past').reduce((sum, trip) => sum + trip.budget, 0)
  const totalSpent = trips.filter((trip) => trip.status !== 'past').reduce((sum, trip) => sum + trip.spent, 0)

  function saveTrip(next: Trip) {
    setTrips((current) => {
      const exists = current.some((trip) => trip.id === next.id)
      return exists ? current.map((trip) => trip.id === next.id ? next : trip) : [next, ...current]
    })
    setSelectedTrip(next)
    setModal(null)
    setToast('Your trip is ready to go.')
  }
  function openNav(label: string) {
    navigate(navPaths[label] ?? '/')
    setActiveNav(label)
    setMobileMenu(false)
  }
  function updateTrip(next: Trip) {
    setTrips((current) => current.map((trip) => trip.id === next.id ? next : trip))
    setSelectedTrip(next)
  }
  function duplicateTrip(trip: Trip) {
    const copy = { ...trip, id: Date.now(), name: `${trip.name} (copy)`, status: 'planning' as const }
    setTrips((current) => [copy, ...current])
    setMenuTrip(null)
    setToast('Trip duplicated — make it your own.')
  }
  function archiveTrip(trip: Trip) {
    const archived = { ...trip, status: 'past' as const }
    setTrips((current) => current.map((item) => item.id === trip.id ? archived : item))
    setMenuTrip(null)
    setToast('Trip moved to past trips.')
  }
  function deleteTrip(trip: Trip) {
    if (!window.confirm(`Delete "${trip.name}"? This cannot be undone.`)) return
    setTrips((current) => current.filter((item) => item.id !== trip.id))
    setMenuTrip(null)
    if (selectedTrip?.id === trip.id) setSelectedTrip(null)
    setToast('Trip deleted.')
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <a className="brand" href="/" onClick={(event) => { event.preventDefault(); openNav('Overview') }}>
          <span className="brand-mark"><Feather size={19} strokeWidth={2.3} /></span>
          <span>wayfarer<span className="brand-period">.</span></span>
        </a>
        <div className="sidebar-label">YOUR SPACE</div>
        <nav className="primary-nav">
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-link ${activeNav === label ? 'active' : ''}`} onClick={() => openNav(label)}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              {label === 'My trips' && <span className="nav-count">{trips.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-separator" />
        <div className="sidebar-label">YOUR COLLECTIONS</div>
        <button className="collection-link" onClick={() => setToast('Your saved places are right around the corner.')}>
          <span className="collection-dot dot-orange" /><span>Weekend escapes</span><span className="collection-count">4</span>
        </button>
        <button className="collection-link" onClick={() => setToast('Your saved places are right around the corner.')}>
          <span className="collection-dot dot-blue" /><span>Somewhere warm</span><span className="collection-count">7</span>
        </button>
        <button className="new-collection" onClick={() => openNav('Explore')}><Plus size={15} /> New collection</button>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><CircleHelp size={17} /></div>
            <strong>A little help?</strong>
            <p>Good trips start with good questions.</p>
            <button onClick={() => setToast('We’re here whenever you need us.')}>Visit our help centre <ArrowRight size={13} /></button>
          </div>
          <button className="profile-row" onClick={() => setModal('profile')}>
            <span className="avatar">A</span>
            <span className="profile-name"><strong>Alex Morgan</strong><small>Free plan</small></span>
            <MoreHorizontal size={19} className="profile-more" />
          </button>
        </div>
      </aside>

      {mobileMenu && <button className="mobile-backdrop" aria-label="Close menu" onClick={() => setMobileMenu(false)} />}
      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu-button icon-button" aria-label="Open menu" onClick={() => setMobileMenu(true)}><Menu size={21} /></button>
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{activeNav}</strong></div>
          <div className="topbar-actions">
            <label className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search anything..." /><kbd>⌘ K</kbd></label>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setToast('You’re all caught up. Enjoy the calm.')}>
              <Bell size={19} /><span className="notification-dot" />
            </button>
            <button className="top-avatar" onClick={() => setModal('profile')} aria-label="Open profile">A</button>
          </div>
        </header>

        <div className="page-content">
          {activeNav === 'Overview' && (
            <>
              <section className="welcome-row">
                <div><div className="eyebrow"><Sparkles size={13} /> MONDAY, OCTOBER 5</div><h1>Good afternoon, Alex <span className="wave">✳</span></h1><p className="welcome-subtitle">A little daydreaming is good for you.</p></div>
                <button className="button button-primary" onClick={() => setModal('create')}><Plus size={17} /> Plan a new trip</button>
              </section>

              <section className="stats-row">
                <div className="stat-card"><div className="stat-icon icon-green"><Globe2 size={18} /></div><div><span className="stat-label">TRIPS PLANNED</span><strong>{trips.length.toString().padStart(2, '0')}</strong><small><span className="stat-positive">+1</span> this season</small></div><span className="stat-scribble">↗</span></div>
                <div className="stat-card"><div className="stat-icon icon-yellow"><CalendarDays size={18} /></div><div><span className="stat-label">DAYS UNTIL TAKEOFF</span><strong>{featuredTrip ? daysUntil(featuredTrip.start) : '—'}</strong><small>{featuredTrip ? `until ${featuredTrip.destinations[0]}` : 'Your next trip awaits'}</small></div><span className="stat-scribble">✳</span></div>
                <div className="stat-card"><div className="stat-icon icon-lilac"><Wallet size={18} /></div><div><span className="stat-label">TRIP BUDGET</span><strong>{formatMoney(totalBudget)}</strong><small><span className="stat-positive">{Math.round((totalSpent / (totalBudget || 1)) * 100)}%</span> of budget used</small></div><div className="mini-progress"><span style={{ width: `${Math.min(100, (totalSpent / (totalBudget || 1)) * 100)}%` }} /></div></div>
              </section>

              {featuredTrip && <section className="featured-section">
                <div className="section-heading"><div><span className="section-kicker">PICKING UP WHERE YOU LEFT OFF</span><h2>Your next adventure</h2></div><button className="text-link" onClick={() => { openNav('My trips'); setTripFilter('all') }}>All trips <ArrowRight size={15} /></button></div>
                <div className="featured-card">
                  <div className="featured-image" style={{ backgroundImage: `url("${featuredTrip.image}")` }}>
                    <div className="image-chip"><span className="live-dot" /> {featuredTrip.status === 'planning' ? 'IN THE MAKING' : 'COMING UP NEXT'}</div>
                    <button className="image-arrow" aria-label="Open trip" onClick={() => setSelectedTrip(featuredTrip)}><ArrowUpRight size={19} /></button>
                  </div>
                  <div className="featured-details">
                    <div className="trip-title-line"><div><div className="trip-destinations"><MapPin size={13} /> {featuredTrip.destinations.join('  ·  ')}</div><h3>{featuredTrip.name}</h3></div><button className="more-button" aria-label="More options" onClick={() => setMenuTrip(menuTrip === featuredTrip.id ? null : featuredTrip.id)}><Ellipsis size={20} /></button></div>
                    {menuTrip === featuredTrip.id && <TripMenu onEdit={() => { setSelectedTrip(featuredTrip); setModal('edit'); setMenuTrip(null) }} onDuplicate={() => duplicateTrip(featuredTrip)} onArchive={() => archiveTrip(featuredTrip)} onDelete={() => deleteTrip(featuredTrip)} />}
                    <div className="featured-meta"><span><CalendarDays size={15} /> {dateRange(featuredTrip)}</span><span><Users size={15} /> {featuredTrip.travellers} travellers</span><span><Wallet size={15} /> {formatMoney(featuredTrip.budget)}</span></div>
                    <div className="progress-copy"><span>Trip budget</span><span><b>{formatMoney(featuredTrip.spent)}</b> of {formatMoney(featuredTrip.budget)}</span></div>
                    <div className="progress-track"><span style={{ width: `${Math.min(100, (featuredTrip.spent / featuredTrip.budget) * 100)}%` }} /></div>
                    <div className="featured-footer"><span className="countdown"><span className="countdown-number">{daysUntil(featuredTrip.start)}</span> days to go</span><button className="button button-dark" onClick={() => setSelectedTrip(featuredTrip)}>Open itinerary <ArrowRight size={15} /></button></div>
                  </div>
                </div>
              </section>}

              <section className="trips-section">
                <div className="section-heading section-heading-tight"><div><span className="section-kicker">THE PLACES YOU’RE GOING</span><h2>Your trips <span className="heading-count">{trips.length}</span></h2></div><button className="text-link" onClick={() => { openNav('My trips'); setTripFilter('all') }}>See all trips <ArrowRight size={15} /></button></div>
                <div className="trip-card-grid">
                  {trips.filter((trip) => trip.id !== featuredTrip?.id && trip.status !== 'past').slice(0, 2).map((trip) => <TripCard key={trip.id} trip={trip} onOpen={() => setSelectedTrip(trip)} onMenu={() => setMenuTrip(menuTrip === trip.id ? null : trip.id)} menuOpen={menuTrip === trip.id} onEdit={() => { setSelectedTrip(trip); setModal('edit'); setMenuTrip(null) }} onDuplicate={() => duplicateTrip(trip)} onArchive={() => archiveTrip(trip)} onDelete={() => deleteTrip(trip)} />)}
                  {trips.filter((trip) => trip.status !== 'past').length < 2 && <button className="add-trip-card" onClick={() => setModal('create')}><span className="add-circle"><Plus size={21} /></span><strong>There’s room for one more</strong><span>Start planning your next little escape</span><span className="add-trip-link">Create a trip <ArrowRight size={14} /></span></button>}
                </div>
              </section>

              <section className="inspiration-section">
                <div className="section-heading section-heading-tight"><div><span className="section-kicker">A LITTLE INSPIRATION</span><h2>Somewhere to next?</h2></div><button className="text-link" onClick={() => openNav('Explore')}>Explore all <ArrowRight size={15} /></button></div>
                <div className="recommendation-grid">
                  {recommendations.map((place) => <button className="recommendation-card" key={place.name} onClick={() => { openNav('Explore'); setToast(`${place.name} added to your inspiration list.`) }}>
                    <div className="recommendation-image" style={{ backgroundImage: `url("${place.image}")` }}><span className="recommendation-arrow"><ArrowUpRight size={15} /></span></div><div className="recommendation-copy"><span>{place.category}</span><strong>{place.name}</strong><small>{place.detail}</small></div>
                  </button>)}
                </div>
              </section>
              <footer className="page-footer"><span>Made for the places that stay with you.</span><span>© 2026 Wayfarer <i>·</i> Made with a little wanderlust</span></footer>
            </>
          )}

          {activeNav === 'My trips' && <TripsPage trips={visibleTrips} filter={tripFilter} setFilter={setTripFilter} onCreate={() => setModal('create')} onOpen={setSelectedTrip} onEdit={(trip) => { setSelectedTrip(trip); setModal('edit') }} onDuplicate={duplicateTrip} onArchive={archiveTrip} onDelete={deleteTrip} />}
          {activeNav === 'Explore' && <ExplorePage savedPlaces={savedPlaces} onSave={(name) => { setSavedPlaces((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]); setToast(savedPlaces.includes(name) ? 'Removed from saved places.' : 'Saved for a little later.') }} onCreate={() => setModal('create')} />}
          {activeNav === 'Bookings' && <BookingsPage trips={trips} onOpen={(trip) => setSelectedTrip(trip)} />}
          {activeNav === 'Budget' && <BudgetPage trips={trips} onOpen={(trip) => setSelectedTrip(trip)} />}
        </div>
      </main>

      {selectedTrip && <TripDetails trip={trips.find((trip) => trip.id === selectedTrip.id) ?? selectedTrip} onClose={() => setSelectedTrip(null)} onEdit={(trip) => { setSelectedTrip(trip); setModal('edit') }} onUpdate={updateTrip} toast={setToast} />}
      {modal === 'create' && <TripForm onClose={() => setModal(null)} onSave={saveTrip} />}
      {modal === 'edit' && selectedTrip && <TripForm trip={trips.find((trip) => trip.id === selectedTrip.id) ?? selectedTrip} onClose={() => setModal(null)} onSave={saveTrip} />}
      {modal === 'profile' && <ProfileModal onClose={() => setModal(null)} toast={setToast} />}
      {toast && <div className="toast"><span className="toast-check"><Check size={14} /></span>{toast}</div>}
    </div>
  )
}

function TripMenu({ onEdit, onDuplicate, onArchive, onDelete }: { onEdit: () => void; onDuplicate: () => void; onArchive: () => void; onDelete: () => void }) {
  return <div className="trip-menu">
    <button onClick={onEdit}><Settings size={14} /> Edit trip</button>
    <button onClick={onDuplicate}><Copy size={14} /> Duplicate</button>
    <button onClick={onArchive}><ArrowDownUp size={14} /> Move to past trips</button>
    <button onClick={onDelete}><Trash2 size={14} /> Delete trip</button>
  </div>
}

function TripCard({ trip, onOpen, onMenu, menuOpen, onEdit, onDuplicate, onArchive, onDelete }: { trip: Trip; onOpen: () => void; onMenu: () => void; menuOpen: boolean; onEdit: () => void; onDuplicate: () => void; onArchive: () => void; onDelete: () => void }) {
  return <article className="trip-card">
    <button className="trip-card-image" style={{ backgroundImage: `url("${trip.image}")` }} onClick={onOpen} aria-label={`Open ${trip.name}`}><span className="trip-card-badge">{trip.status === 'planning' ? 'PLANNING' : 'UP NEXT'}</span><span className="trip-card-image-arrow"><ArrowUpRight size={17} /></span></button>
    <div className="trip-card-body">
      <div className="trip-card-header"><div><div className="trip-destinations"><MapPin size={12} /> {trip.destinations.join(' · ')}</div><h3>{trip.name}</h3></div><button className="more-button" onClick={onMenu} aria-label="Trip options"><Ellipsis size={19} /></button></div>
      {menuOpen && <TripMenu onEdit={onEdit} onDuplicate={onDuplicate} onArchive={onArchive} onDelete={onDelete} />}
      <div className="trip-card-meta"><span><CalendarDays size={14} /> {dateRange(trip)}</span><span><Users size={14} /> {trip.travellers}</span></div>
      <button className="trip-card-open" onClick={onOpen}>View trip <ArrowRight size={14} /></button>
    </div>
  </article>
}

function TripsPage({ trips, filter, setFilter, onCreate, onOpen, onEdit, onDuplicate, onArchive, onDelete }: { trips: Trip[]; filter: 'all' | 'upcoming' | 'past'; setFilter: (value: 'all' | 'upcoming' | 'past') => void; onCreate: () => void; onOpen: (trip: Trip) => void; onEdit: (trip: Trip) => void; onDuplicate: (trip: Trip) => void; onArchive: (trip: Trip) => void; onDelete: (trip: Trip) => void }) {
  const [menuTripId, setMenuTripId] = useState<number | null>(null)
  return <div className="inner-page">
    <div className="inner-page-top"><div><div className="eyebrow"><MapPin size={13} /> YOUR LITTLE CORNER OF THE WORLD</div><h1>All your trips</h1><p className="welcome-subtitle">Every adventure starts somewhere.</p></div><button className="button button-primary" onClick={onCreate}><Plus size={17} /> Plan a new trip</button></div>
    <div className="filter-row"><div className="filter-tabs">{(['all', 'upcoming', 'past'] as const).map((item) => <button key={item} className={filter === item ? 'filter-active' : ''} onClick={() => setFilter(item)}>{item === 'all' ? 'All trips' : item === 'upcoming' ? 'Upcoming' : 'Past trips'}</button>)}</div><span className="filter-result"><Filter size={14} /> {trips.length} {trips.length === 1 ? 'trip' : 'trips'}</span></div>
    {trips.length > 0 ? <div className="all-trips-grid">{trips.map((trip) => <TripCard key={trip.id} trip={trip} onOpen={() => onOpen(trip)} onMenu={() => setMenuTripId(menuTripId === trip.id ? null : trip.id)} menuOpen={menuTripId === trip.id} onEdit={() => { setMenuTripId(null); onEdit(trip) }} onDuplicate={() => { setMenuTripId(null); onDuplicate(trip) }} onArchive={() => { setMenuTripId(null); onArchive(trip) }} onDelete={() => { setMenuTripId(null); onDelete(trip) }} />)}</div> : <div className="empty-state"><span><Compass size={24} /></span><h3>No trips found just yet</h3><p>Try another search, or start planning something lovely.</p><button className="button button-primary" onClick={onCreate}><Plus size={16} /> Plan a trip</button></div>}
  </div>
}

function ExplorePage({ savedPlaces, onSave, onCreate }: { savedPlaces: string[]; onSave: (name: string) => void; onCreate: () => void }) {
  const places = [
    { name: 'Fushimi Inari Taisha', location: 'Kyoto, Japan', type: 'Temple · A little magic', image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?auto=format&fit=crop&w=1000&q=85', rating: '4.9' },
    { name: 'A table at Bar Benfiddich', location: 'Shinjuku, Tokyo', type: 'Cocktail bar · After dark', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1000&q=85', rating: '4.8' },
    { name: 'Arashiyama bamboo grove', location: 'Kyoto, Japan', type: 'Nature · Go early', image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1000&q=85', rating: '4.9' },
    { name: 'A tiny coffee break', location: 'Nakameguro, Tokyo', type: 'Cafe · Local favourite', image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1000&q=85', rating: '4.7' },
  ]
  return <div className="inner-page"><div className="inner-page-top"><div><div className="eyebrow"><Compass size={13} /> FIND YOUR NEXT FAVOURITE</div><h1>Go somewhere new.</h1><p className="welcome-subtitle">A few lovely places to get you dreaming.</p></div><button className="button button-primary" onClick={onCreate}><Plus size={17} /> Plan a trip</button></div>
    <div className="explore-banner"><div><span className="section-kicker">CURATED FOR CURIOUS PEOPLE</span><h2>Japan, beyond the guidebook</h2><p>Quiet corners, neighbourhood favourites, and the long way home.</p><button className="button button-dark" onClick={onCreate}>Plan a Japan trip <ArrowRight size={15} /></button></div><div className="explore-banner-photo" /></div>
    <div className="explore-toolbar"><div><span className="section-kicker">GOOD THINGS TO FIND</span><h2>Places worth the detour</h2></div><span className="filter-result"><Sparkles size={14} /> Picked for you</span></div>
    <div className="places-grid">{places.map((place) => <article className="place-card" key={place.name}><div className="place-image" style={{ backgroundImage: `url("${place.image}")` }}><span className="place-rating">★ {place.rating}</span><button className={`save-place ${savedPlaces.includes(place.name) ? 'saved' : ''}`} onClick={() => onSave(place.name)} aria-label={savedPlaces.includes(place.name) ? 'Remove saved place' : 'Save place'}>{savedPlaces.includes(place.name) ? <Heart size={17} fill="currentColor" /> : <Bookmark size={17} />}</button></div><div className="place-copy"><span>{place.type}</span><h3>{place.name}</h3><small><MapPin size={13} /> {place.location}</small><button onClick={onCreate}>Add to a trip <Plus size={13} /></button></div></article>)}</div>
  </div>
}

function BookingsPage({ trips, onOpen }: { trips: Trip[]; onOpen: (trip: Trip) => void }) {
  const upcoming = trips.filter((trip) => trip.status !== 'past')
  return <div className="inner-page"><div className="inner-page-top"><div><div className="eyebrow"><Ticket size={13} /> ALL THE IMPORTANT DETAILS</div><h1>Your bookings</h1><p className="welcome-subtitle">The practical stuff, all in one place.</p></div></div>
    <div className="booking-summary"><div><span className="stat-label">CONFIRMED & PLANNED</span><strong>{upcoming.length * 2 + 1}</strong><small>across {upcoming.length} upcoming trips</small></div><div className="booking-summary-icon"><Ticket size={23} /></div></div>
    <div className="bookings-list"><div className="booking-list-heading"><span className="section-kicker">UP NEXT</span><span className="filter-result"><CalendarDays size={14} /> {upcoming.length} trips</span></div>
      {upcoming.length ? upcoming.map((trip, index) => <article className="booking-row" key={trip.id}><div className="booking-date"><strong>{niceDate(trip.start, { day: '2-digit' })}</strong><span>{niceDate(trip.start, { month: 'short' })}</span></div><div className="booking-row-icon"><span className={index % 2 ? 'booking-hotel' : ''}>{index % 2 ? <Hotel size={18} /> : <Ticket size={18} />}</span></div><div className="booking-description"><strong>{index % 2 ? 'Stay details & accommodation' : `${trip.destinations[0]} trip details`}</strong><span>{trip.name} · {trip.destinations[0]}</span></div><span className="booking-status"><i /> {index === 0 ? 'To be added' : 'Planning'}</span><button className="booking-arrow" onClick={() => onOpen(trip)} aria-label="Open trip"><ArrowRight size={17} /></button></article>) : <div className="empty-inline">No upcoming trips yet. Start planning to keep bookings together.</div>}
    </div><div className="booking-tip"><span><Sparkles size={17} /></span><div><strong>Everything in one place</strong><p>Add your flight, stay, and activity confirmations inside each trip itinerary.</p></div></div>
  </div>
}

function BudgetPage({ trips, onOpen }: { trips: Trip[]; onOpen: (trip: Trip) => void }) {
  const active = trips.filter((trip) => trip.status !== 'past')
  const budget = active.reduce((sum, trip) => sum + trip.budget, 0)
  const spent = active.reduce((sum, trip) => sum + trip.spent, 0)
  return <div className="inner-page"><div className="inner-page-top"><div><div className="eyebrow"><Wallet size={13} /> SPEND ON THE GOOD STUFF</div><h1>Your trip budget</h1><p className="welcome-subtitle">A little clarity makes room for a lot of adventure.</p></div></div>
    <div className="budget-overview"><div><span className="section-kicker">ALL UPCOMING TRIPS</span><strong>{formatMoney(budget)}</strong><span className="budget-subline">planned · {formatMoney(spent)} spent so far</span><div className="large-progress"><span style={{ width: `${Math.min(100, (spent / (budget || 1)) * 100)}%` }} /></div><div className="budget-legend"><span><i /> Spent <b>{Math.round((spent / (budget || 1)) * 100)}%</b></span><span><i /> Still to spend <b>{formatMoney(Math.max(0, budget - spent))}</b></span></div></div><div className="budget-art"><div className="budget-circle"><Wallet size={31} /></div><span>travel fund</span><strong>Let’s make it count.</strong></div></div>
    <div className="budget-trip-list"><div className="section-heading section-heading-tight"><div><span className="section-kicker">BY ADVENTURE</span><h2>Trip budgets</h2></div></div>{active.map((trip) => <button className="budget-trip-row" key={trip.id} onClick={() => onOpen(trip)}><span className="budget-trip-thumb" style={{ backgroundImage: `url("${trip.image}")` }} /><span className="budget-trip-name"><strong>{trip.name}</strong><small>{trip.destinations.join(' · ')}</small></span><span className="budget-trip-progress"><span className="progress-track"><span style={{ width: `${Math.min(100, (trip.spent / trip.budget) * 100)}%` }} /></span><small>{formatMoney(trip.spent)} spent</small></span><strong className="budget-trip-total">{formatMoney(trip.budget)}</strong><ChevronRight size={17} /></button>)}</div>
  </div>
}

function TripDetails({ trip, onClose, onEdit, onUpdate, toast }: { trip: Trip; onClose: () => void; onEdit: (trip: Trip) => void; onUpdate: (trip: Trip) => void; toast: (value: string) => void }) {
  const [day, setDay] = useState(1)
  const [adding, setAdding] = useState(false)
  const [activityName, setActivityName] = useState('')
  const [activityTime, setActivityTime] = useState('09:00')
  const [activityPlace, setActivityPlace] = useState('')
  const [activityNotes, setActivityNotes] = useState('')
  const [activityCost, setActivityCost] = useState('')
  const [tab, setTab] = useState<'itinerary' | 'overview'>('itinerary')
  const submitActivity = (event: React.FormEvent) => {
    event.preventDefault()
    if (!activityName.trim()) return
    const next = { ...trip, activities: [...trip.activities, { title: activityName.trim(), time: activityTime, place: activityPlace.trim() || trip.destinations[0], type: 'Plan', day, notes: activityNotes.trim() || undefined, cost: Number(activityCost) || undefined }].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time)) }
    onUpdate(next)
    setActivityName('')
    setActivityPlace('')
    setActivityNotes('')
    setActivityCost('')
    setAdding(false)
    toast('Added to your itinerary.')
  }
  const removeActivity = (activity: Activity) => {
    onUpdate({ ...trip, activities: trip.activities.filter((item) => item !== activity) })
    toast('Activity removed.')
  }
  const dayCount = Math.max(1, Math.round((new Date(trip.end).getTime() - new Date(trip.start).getTime()) / 86400000) + 1)
  const cityForDay = trip.destinations[Math.min(Math.floor((day - 1) / Math.max(1, Math.ceil(dayCount / trip.destinations.length))), trip.destinations.length - 1)]
  return <div className="drawer-backdrop" onClick={onClose}><aside className="trip-drawer" onClick={(event) => event.stopPropagation()}>
    <div className="drawer-hero" style={{ backgroundImage: `url("${trip.image}")` }}><button className="drawer-close" onClick={onClose} aria-label="Close trip"><X size={19} /></button><span className="drawer-image-tag"><MapPin size={12} /> YOUR TRIP</span></div>
    <div className="drawer-content"><div className="trip-destinations"><MapPin size={13} /> {trip.destinations.join('  ·  ')}</div><h2>{trip.name}</h2><div className="drawer-meta"><span><CalendarDays size={15} />{dateRange(trip)}</span><span><Users size={15} />{trip.travellers} travellers</span></div>
      <div className="drawer-tabs"><button className={tab === 'itinerary' ? 'selected' : ''} onClick={() => setTab('itinerary')}>Itinerary</button><button className={tab === 'overview' ? 'selected' : ''} onClick={() => setTab('overview')}>Trip overview</button><button className="drawer-edit" onClick={() => onEdit(trip)}><Settings size={14} /> Edit</button></div>
      {tab === 'itinerary' ? <div className="itinerary">
        <div className="day-switcher"><button aria-label="Previous day" onClick={() => setDay((current) => Math.max(1, current - 1))}><ChevronLeft size={17} /></button><div><span>DAY {String(day).padStart(2, '0')} <i>OF {String(dayCount).padStart(2, '0')}</i></span><strong>{cityForDay}</strong></div><button aria-label="Next day" onClick={() => setDay((current) => Math.min(dayCount, current + 1))}><ChevronRight size={17} /></button></div>
        <div className="day-date">{niceDate(new Date(new Date(`${trip.start}T12:00:00`).getTime() + (day - 1) * 86400000).toISOString().slice(0, 10), { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <div className="timeline">{trip.activities.filter((activity) => activity.day === day).map((activity, index) => <div className="timeline-item" key={`${activity.title}-${index}`}><div className="timeline-time">{activity.time}</div><div className="timeline-marker"><span className={activity.type === 'Food' ? 'marker-food' : ''} /></div><div className="timeline-card"><div className="timeline-card-top"><span>{activity.type}</span><button aria-label={`Remove ${activity.title}`} onClick={() => removeActivity(activity)}><Trash2 size={14} /></button></div><strong>{activity.title}</strong><small><MapPin size={12} /> {activity.place}</small>{activity.notes && <small className="activity-note">{activity.notes}</small>}{activity.cost !== undefined && <small className="activity-cost">Est. {formatMoney(activity.cost)}</small>}</div></div>)}
          {trip.activities.filter((activity) => activity.day === day).length === 0 && !adding && <div className="empty-day">A day with room to wander. Add a little plan?</div>}
          {adding && <form className="add-activity-form" onSubmit={submitActivity}><div className="add-activity-title"><strong>A little something to do</strong><button type="button" onClick={() => setAdding(false)} aria-label="Cancel"><X size={15} /></button></div><input required value={activityName} onChange={(event) => setActivityName(event.target.value)} placeholder="Activity name" /><div className="activity-input-row"><input type="time" value={activityTime} onChange={(event) => setActivityTime(event.target.value)} /><input value={activityPlace} onChange={(event) => setActivityPlace(event.target.value)} placeholder="Where?" /></div><input value={activityNotes} onChange={(event) => setActivityNotes(event.target.value)} placeholder="A note (optional)" /><input type="number" min="0" value={activityCost} onChange={(event) => setActivityCost(event.target.value)} placeholder="Estimated cost (₹)" /><button className="button button-primary activity-save">Add to day <ArrowRight size={14} /></button></form>}
        </div>
        {!adding && <button className="add-activity-button" onClick={() => setAdding(true)}><span><Plus size={16} /></span> Add to your day</button>}
      </div> : <div className="overview-panel"><div className="overview-note"><span><Feather size={16} /></span><p>{trip.description || `${trip.name} is your little adventure. Keep your plans, places, and all the important details together here.`}</p></div><div className="overview-detail"><span>DESTINATIONS</span><strong>{trip.destinations.map((place, index) => <i key={place}>{String(index + 1).padStart(2, '0')} &nbsp;{place}</i>)}</strong></div><div className="overview-detail"><span>TRIP BUDGET</span><strong>{formatMoney(trip.budget)} <small>· {formatMoney(trip.spent)} spent</small></strong></div><div className="overview-detail"><span>TRAVELLERS</span><strong>{trip.travellers} people</strong></div><button className="button button-primary overview-edit" onClick={() => onEdit(trip)}>Edit trip details <ArrowRight size={15} /></button></div>}
    </div>
  </aside></div>
}

function TripForm({ trip, onClose, onSave }: { trip?: Trip; onClose: () => void; onSave: (trip: Trip) => void }) {
  const [name, setName] = useState(trip?.name ?? '')
  const [description, setDescription] = useState(trip?.description ?? '')
  const [destination, setDestination] = useState(trip?.destinations.join(', ') ?? '')
  const [start, setStart] = useState(trip?.start ?? '')
  const [end, setEnd] = useState(trip?.end ?? '')
  const [budget, setBudget] = useState(String(trip?.budget ?? ''))
  const [travellers, setTravellers] = useState(String(trip?.travellers ?? 2))
  const [error, setError] = useState('')
  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || !destination.trim() || !start || !end || !budget) { setError('A trip name, destination, dates, and budget will get us started.'); return }
    if (new Date(end) < new Date(start)) { setError('Your return date should be after your start date.'); return }
    const parsedBudget = Number(budget)
    if (!Number.isFinite(parsedBudget) || parsedBudget < 0) { setError('Please enter a valid trip budget.'); return }
    const destinations = destination.split(',').map((place) => place.trim()).filter(Boolean)
    const existing = trip?.id ? trip : undefined
    onSave({
      id: trip?.id ?? Date.now(),
      name: name.trim(),
      description: description.trim() || undefined,
      destinations,
      start,
      end,
      image: trip?.image ?? 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85',
      budget: parsedBudget,
      spent: trip?.spent ?? 0,
      travellers: Math.max(1, Number(travellers) || 1),
      status: existing?.status ?? 'planning',
      activities: trip?.activities ?? [],
    })
  }
  return <div className="modal-backdrop" onClick={onClose}><section className="trip-form-modal" onClick={(event) => event.stopPropagation()}><div className="modal-heading"><div><div className="eyebrow"><Sparkles size={13} /> MAKE SOME PLANS</div><h2>{trip ? 'A little trip tune-up' : 'Where to next?'}</h2><p>Good things are just around the corner.</p></div><button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
    <form onSubmit={submit} className="trip-form"><label>Give this trip a name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Japan, at your own pace" autoFocus /></label><label>A few words about it<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What are you looking forward to?" rows={2} /></label><label>Where are you going?<input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Tokyo, Kyoto, Osaka" /><small>Separate each destination with a comma.</small></label><div className="form-row"><label>Leaving on<input type="date" value={start} onChange={(event) => setStart(event.target.value)} /></label><label>Coming home<input type="date" value={end} onChange={(event) => setEnd(event.target.value)} min={start} /></label></div><div className="form-row"><label>Trip budget<input type="number" min="0" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="150000" /></label><label>Travellers<input type="number" min="1" max="30" value={travellers} onChange={(event) => setTravellers(event.target.value)} /></label></div>{error && <p className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="button button-soft" onClick={onClose}>Maybe later</button><button className="button button-primary">{trip ? 'Save changes' : 'Create my trip'} <ArrowRight size={15} /></button></div></form>
  </section></div>
}

function ProfileModal({ onClose, toast }: { onClose: () => void; toast: (value: string) => void }) {
  return <div className="modal-backdrop" onClick={onClose}><section className="profile-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button><div className="profile-big-avatar">A</div><div className="eyebrow"><Sparkles size={13} /> YOUR WAYFARER ACCOUNT</div><h2>Alex Morgan</h2><p>alex.morgan@example.com</p><div className="profile-plan"><span className="profile-plan-icon"><Globe2 size={18} /></span><span><strong>Free plan</strong><small>All your adventures, together.</small></span><ArrowRight size={16} /></div><button className="profile-setting" onClick={() => toast('Profile settings are up to date.')}><Settings size={16} /> Account settings <ChevronRight size={15} /></button><button className="profile-setting" onClick={() => { onClose(); toast('You’re safely signed in on this device.') }}><LogOut size={16} /> Sign out <ChevronRight size={15} /></button><button className="profile-privacy" onClick={onClose}>Privacy · Terms · Help</button></section></div>
}

export default App
