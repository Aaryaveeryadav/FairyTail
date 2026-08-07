import { useEffect, useState } from 'react';
import { Plus, Image as ImageIcon, Video, FileText, Mic, X, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Memory, MemoryType } from '@/lib/types';

export function Memories() {
  const { user, partner, couple } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [type, setType] = useState<MemoryType>('photo');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (!couple) return;
    supabase
      .from('memories')
      .select('*')
      .eq('couple_id', couple.id)
      .order('memory_date', { ascending: false })
      .then(({ data }) => setMemories((data as Memory[]) ?? []));
  };

  useEffect(load, [couple]);

  const addMemory = async () => {
    if (!couple || !user) return;
    setBusy(true);
    let fileUrl: string | null = null;

    if (file && (type === 'photo' || type === 'video' || type === 'voice')) {
      const ext = file.name.split('.').pop();
      const path = `${couple.id}/${Date.now()}.${ext}`;
      const bucket = type === 'photo' ? 'memory-photos' : type === 'video' ? 'memory-videos' : 'voice-notes';
      const { error } = await supabase.storage.from(bucket).upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
        fileUrl = urlData.publicUrl;
      }
    }

    await supabase.from('memories').insert({
      couple_id: couple.id,
      author_id: user.id,
      type,
      title: title || null,
      description: description || null,
      file_url: fileUrl,
      memory_date: memoryDate,
    });

    setShowAdd(false);
    setTitle('');
    setDescription('');
    setFile(null);
    setBusy(false);
    load();
  };

  const typeIcon = (t: MemoryType) => {
    switch (t) {
      case 'photo': return ImageIcon;
      case 'video': return Video;
      case 'voice': return Mic;
      case 'note': return FileText;
    }
  };

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-ink-900">Memory Album</h2>
        <button onClick={() => setShowAdd(true)} className="p-2.5 bg-rose-500 hover:bg-rose-600 rounded-xl text-white transition-colors">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {memories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cream-200 flex items-center justify-center mb-3">
            <ImageIcon className="w-8 h-8 text-ink-300" />
          </div>
          <p className="font-serif text-lg text-ink-400">No memories yet</p>
          <p className="text-sm text-ink-300 mt-1">Add your first memory together</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {memories.map((mem) => {
            const Icon = typeIcon(mem.type);
            const author = mem.author_id === user?.id ? 'You' : partner?.display_name;
            return (
              <div key={mem.id} className="rounded-2xl overflow-hidden bg-white border border-cream-200 shadow-sm group cursor-pointer hover:shadow-md transition-all">
                {mem.type === 'photo' && mem.file_url ? (
                  <img src={mem.file_url} alt={mem.title ?? ''} className="w-full h-32 object-cover" />
                ) : mem.type === 'video' && mem.file_url ? (
                  <video src={mem.file_url} className="w-full h-32 object-cover" controls />
                ) : mem.type === 'voice' && mem.file_url ? (
                  <div className="w-full h-32 flex flex-col items-center justify-center bg-cream-50 p-3">
                    <Mic className="w-8 h-8 text-rose-400 mb-2" />
                    <audio controls src={mem.file_url} className="w-full h-8" />
                  </div>
                ) : (
                  <div className="w-full h-32 flex flex-col items-center justify-center bg-gradient-to-br from-cream-50 to-rose-50 p-3">
                    <Icon className="w-8 h-8 text-rose-300 mb-2" />
                    <p className="text-xs text-ink-600 text-center line-clamp-3">{mem.description ?? mem.title}</p>
                  </div>
                )}
                <div className="p-2.5">
                  {mem.title && <p className="text-sm font-medium text-ink-900 truncate">{mem.title}</p>}
                  <p className="text-[10px] text-ink-400 mt-0.5">
                    {new Date(mem.memory_date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })} · {author}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowAdd(false)}>
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto scrollbar-thin" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl text-ink-900">New Memory</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 hover:bg-cream-100 rounded-lg"><X className="w-5 h-5 text-ink-400" /></button>
            </div>

            <div className="flex gap-2 mb-4">
              {(['photo', 'video', 'note', 'voice'] as MemoryType[]).map((t) => {
                const Icon = typeIcon(t);
                return (
                  <button key={t} onClick={() => setType(t)} className={`flex-1 p-3 rounded-xl border transition-all ${type === t ? 'bg-rose-50 border-rose-300 text-rose-600' : 'bg-cream-50 border-cream-200 text-ink-400'}`}>
                    <Icon className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs capitalize">{t}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              <label htmlFor="memoryTitle" className="sr-only">Memory title</label>
              <input id="memoryTitle" name="memoryTitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" className="w-full px-4 py-2.5 rounded-xl bg-cream-50 border border-cream-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              <label htmlFor="memoryDescription" className="sr-only">Memory description</label>
              <textarea id="memoryDescription" name="memoryDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description / note" rows={3} className="w-full px-4 py-2.5 rounded-xl bg-cream-50 border border-cream-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none" />
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <label htmlFor="memoryDate" className="sr-only">Memory date</label>
                <input id="memoryDate" name="memoryDate" type="date" value={memoryDate} onChange={(e) => setMemoryDate(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream-50 border border-cream-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              </div>
              {(type === 'photo' || type === 'video' || type === 'voice') && (
                <input id="memoryFile" name="memoryFile" type="file" accept={type === 'photo' ? 'image/*' : type === 'video' ? 'video/*' : 'audio/*'} onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-sm text-ink-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-rose-50 file:text-rose-600 file:font-medium" aria-label="Memory file upload" />
              )}
              <button onClick={addMemory} disabled={busy} className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium transition-colors disabled:opacity-60">
                {busy ? 'Saving...' : 'Save Memory'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}