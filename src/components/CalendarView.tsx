import { useEffect, useState } from 'react';
import { Plus, X, Cake, Bell, CalendarHeart, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { CalendarEvent, CalendarEventType } from '@/lib/types';

const EVENT_TYPES: { type: CalendarEventType; label: string; icon: typeof Cake; color: string }[] = [
  { type: 'plan', label: 'Date Plan', icon: CalendarHeart, color: 'bg-rose-100 text-rose-600 border-rose-200' },
  { type: 'birthday', label: 'Birthday', icon: Cake, color: 'bg-amber-100 text-amber-600 border-amber-200' },
  { type: 'reminder', label: 'Reminder', icon: Bell, color: 'bg-blue-100 text-blue-600 border-blue-200' },
  { type: 'schedule', label: 'Schedule', icon: Clock, color: 'bg-ink-100 text-ink-600 border-ink-200' },
];

export function Calendar() {
  const { user, couple } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventTime, setEventTime] = useState('');
  const [eventType, setEventType] = useState<CalendarEventType>('plan');

  const load = () => {
    if (!couple) return;
    supabase
      .from('calendar_events')
      .select('*')
      .eq('couple_id', couple.id)
      .order('event_date', { ascending: true })
      .then(({ data }) => setEvents((data as CalendarEvent[]) ?? []));
  };

  useEffect(load, [couple]);

  const addEvent = async () => {
    if (!couple || !user || !title.trim()) return;
    await supabase.from('calendar_events').insert({
      couple_id: couple.id,
      author_id: user.id,
      title: title.trim(),
      description: description || null,
      event_date: eventDate,
      event_time: eventTime || null,
      type: eventType,
    });
    setShowAdd(false);
    setTitle('');
    setDescription('');
    setEventTime('');
    load();
  };

  const deleteEvent = async (id: string) => {
    await supabase.from('calendar_events').delete().eq('id', id);
    load();
  };

  const monthName = currentMonth.toLocaleDateString('en', { month: 'long', year: 'numeric' });
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];

  const eventsForDate = (dateStr: string) => events.filter((e) => e.event_date === dateStr);
  const typeInfo = (t: CalendarEventType) => EVENT_TYPES.find((et) => et.type === t) ?? EVENT_TYPES[0];

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-ink-900">Our Calendar</h2>
        <button onClick={() => setShowAdd(true)} className="p-2.5 bg-rose-500 hover:bg-rose-600 rounded-xl text-white transition-colors">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-1.5 hover:bg-cream-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-ink-400" />
          </button>
          <span className="font-serif text-lg text-ink-900">{monthName}</span>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-1.5 hover:bg-cream-100 rounded-lg">
            <ChevronRight className="w-5 h-5 text-ink-400" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-xs text-ink-400 font-medium py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = eventsForDate(dateStr);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all relative ${
                  isToday ? 'bg-rose-500 text-white font-bold' : isSelected ? 'bg-rose-100 text-rose-700' : 'hover:bg-cream-100 text-ink-700'
                }`}
              >
                <span>{day}</span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((e) => {
                      const ti = typeInfo(e.type);
                      return <div key={e.id} className={`w-1 h-1 rounded-full ${isToday ? 'bg-white' : ti.color.split(' ')[0].replace('bg-', 'bg-').replace('-100', '-400')}`} />;
                    })}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-4 animate-slide-up">
          <h3 className="font-medium text-ink-900 mb-3">
            {new Date(selectedDate).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          <div className="space-y-2">
            {eventsForDate(selectedDate).length === 0 ? (
              <p className="text-sm text-ink-400">Nothing planned. Add an event!</p>
            ) : (
              eventsForDate(selectedDate).map((ev) => {
                const ti = typeInfo(ev.type);
                const Icon = ti.icon;
                return (
                  <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl bg-cream-50">
                    <div className={`p-2 rounded-lg border ${ti.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink-900">{ev.title}</p>
                      {ev.event_time && <p className="text-xs text-ink-400">{ev.event_time}</p>}
                      {ev.description && <p className="text-xs text-ink-500 mt-0.5">{ev.description}</p>}
                    </div>
                    <button onClick={() => deleteEvent(ev.id)} className="p-1 hover:bg-rose-50 rounded text-ink-300 hover:text-rose-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowAdd(false)}>
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl text-ink-900">New Event</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 hover:bg-cream-100 rounded-lg"><X className="w-5 h-5 text-ink-400" /></button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                {EVENT_TYPES.map((et) => {
                  const Icon = et.icon;
                  return (
                    <button key={et.type} onClick={() => setEventType(et.type)} className={`flex-1 p-2.5 rounded-xl border transition-all ${eventType === et.type ? et.color : 'bg-cream-50 border-cream-200 text-ink-400'}`}>
                      <Icon className="w-4 h-4 mx-auto mb-1" />
                      <span className="text-[10px]">{et.label}</span>
                    </button>
                  );
                })}
              </div>
              <label htmlFor="eventTitle" className="sr-only">Event title</label>
              <input id="eventTitle" name="eventTitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className="w-full px-4 py-2.5 rounded-xl bg-cream-50 border border-cream-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              <label htmlFor="eventDescription" className="sr-only">Event description</label>
              <textarea id="eventDescription" name="eventDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full px-4 py-2.5 rounded-xl bg-cream-50 border border-cream-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none" />
              <div className="flex gap-2">
                <label htmlFor="eventDate" className="sr-only">Event date</label>
                <input id="eventDate" name="eventDate" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl bg-cream-50 border border-cream-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
                <label htmlFor="eventTime" className="sr-only">Event time</label>
                <input id="eventTime" name="eventTime" type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl bg-cream-50 border border-cream-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              </div>
              <button onClick={addEvent} className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium transition-colors">
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}