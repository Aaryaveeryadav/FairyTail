import { useEffect, useRef, useState } from 'react';
import { Send, Image as ImageIcon, Mic, Smile, Square } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Message } from '@/lib/types';

const STICKERS = ['❤️', '😘', '🥰', '💕', '🌹', '💑', '🧸', '🎁', '🌙', '⭐', '🔥', '✨'];

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });
}

export function Chat() {
  const { user, partner, couple } = useAuth();
  const partnerName = partner?.display_name ?? 'your partner';
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!couple) return;
    const channel = supabase
      .channel('messages')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `couple_id=eq.${couple.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    supabase
      .from('messages')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (data) setMessages(data as Message[]);
      });

    return () => { supabase.removeChannel(channel); };
  }, [couple]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendText = async () => {
    if (!input.trim() || !couple || !user) return;
    const text = input.trim();
    setInput('');
    await supabase.from('messages').insert({
      couple_id: couple.id,
      sender_id: user.id,
      type: 'text',
      content: text,
    });
  };

  const sendSticker = async (sticker: string) => {
    if (!couple || !user) return;
    setShowStickers(false);
    await supabase.from('messages').insert({
      couple_id: couple.id,
      sender_id: user.id,
      type: 'sticker',
      content: sticker,
    });
  };

  const sendPhoto = async (file: File) => {
    if (!couple || !user) return;
    const ext = file.name.split('.').pop();
    const path = `${couple.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('chat-photos').upload(path, file);
    if (upErr) return;
    const { data: urlData } = supabase.storage.from('chat-photos').getPublicUrl(path);
    await supabase.from('messages').insert({
      couple_id: couple.id,
      sender_id: user.id,
      type: 'photo',
      file_url: urlData.publicUrl,
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (!couple || !user) return;
        const path = `${couple.id}/${Date.now()}.webm`;
        const { error: upErr } = await supabase.storage.from('voice-notes').upload(path, blob);
        if (upErr) return;
        const { data: urlData } = supabase.storage.from('voice-notes').getPublicUrl(path);
        await supabase.from('messages').insert({
          couple_id: couple.id,
          sender_id: user.id,
          type: 'voice',
          file_url: urlData.publicUrl,
        });
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      // microphone not available
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-9rem)]">
      <div className="flex items-center gap-3 pb-3 border-b border-cream-200">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-300 to-rose-500 flex items-center justify-center text-white font-medium">
          {partner?.display_name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <p className="font-medium text-ink-900">{partnerName}</p>
          <p className="text-xs text-ink-400">Your private space</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin py-4 space-y-3">
        {messages.map((msg) => {
          const mine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} animate-slide-up`}>
              <div className={`max-w-[75%] ${mine ? 'items-end' : 'items-start'}`}>
                {msg.type === 'text' && (
                  <div className={`px-4 py-2.5 rounded-2xl ${mine ? 'bg-rose-500 text-white rounded-br-md' : 'bg-white text-ink-900 border border-cream-200 rounded-bl-md'}`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                )}
                {msg.type === 'sticker' && (
                  <div className="text-5xl py-1">{msg.content}</div>
                )}
                {msg.type === 'photo' && msg.file_url && (
                  <img src={msg.file_url} alt="Photo" className="rounded-2xl max-w-[240px] border border-cream-200" />
                )}
                {msg.type === 'voice' && msg.file_url && (
                  <div className={`px-4 py-2.5 rounded-2xl ${mine ? 'bg-rose-500' : 'bg-white border border-cream-200'}`}>
                    <audio controls src={msg.file_url} className="h-8 w-48" />
                  </div>
                )}
                <p className={`text-[10px] text-ink-300 mt-1 ${mine ? 'text-right' : 'text-left'}`}>{formatTime(msg.created_at)}</p>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="font-serif text-lg text-ink-400">No messages yet</p>
            <p className="text-sm text-ink-300 mt-1">Say hello to {partner?.display_name} 💕</p>
          </div>
        )}
      </div>

      {showStickers && (
        <div className="grid grid-cols-6 gap-2 p-3 bg-white rounded-2xl border border-cream-200 mb-2 animate-slide-up">
          {STICKERS.map((s) => (
            <button key={s} onClick={() => sendSticker(s)} className="text-3xl hover:scale-110 transition-transform p-1">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 p-2 bg-white rounded-2xl border border-cream-200 shadow-sm">
        <label className="p-2 hover:bg-cream-100 rounded-xl cursor-pointer transition-colors">
          <ImageIcon className="w-5 h-5 text-ink-400" />
          <input name="chatPhoto" type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) sendPhoto(f); }} />
        </label>
        <button onClick={() => setShowStickers(!showStickers)} className="p-2 hover:bg-cream-100 rounded-xl transition-colors">
          <Smile className="w-5 h-5 text-ink-400" />
        </button>
        <label htmlFor="chatInput" className="sr-only">Type a message</label>
        <input
          id="chatInput"
          name="chatInput"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendText()}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 bg-cream-50 rounded-xl text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
        />
        {recording ? (
          <button onClick={stopRecording} className="p-2.5 bg-rose-500 rounded-xl text-white animate-pulse">
            <Square className="w-5 h-5" fill="white" />
          </button>
        ) : (
          <button onClick={startRecording} className="p-2 hover:bg-cream-100 rounded-xl transition-colors">
            <Mic className="w-5 h-5 text-ink-400" />
          </button>
        )}
        <button onClick={sendText} disabled={!input.trim()} className="p-2.5 bg-rose-500 hover:bg-rose-600 rounded-xl text-white disabled:opacity-40 transition-colors">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}