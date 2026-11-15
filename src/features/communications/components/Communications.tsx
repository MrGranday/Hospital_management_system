"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Search,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Users,
  Bell,
  Megaphone,
  Heart,
  Ambulance,
  Pill,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MESSAGE_THREADS, type Message } from "@/lib/data";
import { ColorAvatar, StatusPill } from "@/components/shell/ui-bits";
import { useAppStore } from "@/store/app-store";

const CHANNELS = [
  { id: "direct", label: "Direct Messages", icon: MessageSquare, color: "text-brand-600 bg-brand-50" },
  { id: "cardiology", label: "Cardiology Team", icon: Heart, color: "text-rose-600 bg-rose-50" },
  { id: "er", label: "Emergency Channel", icon: Ambulance, color: "text-amber-600 bg-amber-50" },
  { id: "pharmacy", label: "Pharmacy", icon: Pill, color: "text-emerald-600 bg-emerald-50" },
  { id: "admin", label: "Administration", icon: Users, color: "text-violet-600 bg-violet-50" },
] as const;

const SAMPLE_CONVERSATION = [
  { id: "c1", from: "Dr. James Okoro", fromRole: "ER", avatarColor: "oklch(0.65 0.200 15)", content: "STEMI patient arriving — cath lab ready?", time: "10:42", self: false },
  { id: "c2", from: "You", fromRole: "Cardiology", avatarColor: "oklch(0.535 0.195 245)", content: "Yes, team is prepped. ETA on patient?", time: "10:43", self: true },
  { id: "c3", from: "Dr. James Okoro", fromRole: "ER", avatarColor: "oklch(0.65 0.200 15)", content: "5 minutes out. BP 102/68, HR 96. Troponin pending.", time: "10:44", self: false },
  { id: "c4", from: "You", fromRole: "Cardiology", avatarColor: "oklch(0.535 0.195 245)", content: "Got it. Call when they hit the door.", time: "10:45", self: true },
];

export default function Communications() {
  const [activeChannel, setActiveChannel] = useState<string>("cardiology");
  const [selectedThread, setSelectedThread] = useState<string | null>("msg1");
  const [messageInput, setMessageInput] = useState("");
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState<Array<{ id: string; from: string; fromRole: string; avatarColor: string; content: string; time: string; self: boolean }>>([]);
  const { openModal, pushToast, liveAnnouncements, setPage } = useAppStore();

  // Merge live announcements (mapped to Message shape) with static MESSAGE_THREADS (live first)
  const allThreads: Message[] = [
    ...liveAnnouncements.map((a) => ({
      id: a.id,
      from: a.author,
      fromRole: "Announcement",
      avatarColor: "oklch(0.72 0.17 75)",
      preview: a.subject ? `${a.subject}: ${a.message}` : a.message,
      time: a.date,
      unread: false,
      channel: ("admin" as Message["channel"]),
    })),
    ...MESSAGE_THREADS,
  ];

  const channelMessages = allThreads.filter((m) => m.channel === activeChannel);
  const filteredMessages = search.trim()
    ? channelMessages.filter((m) => {
        const q = search.trim().toLowerCase();
        return m.from.toLowerCase().includes(q) || m.preview.toLowerCase().includes(q) || m.fromRole.toLowerCase().includes(q);
      })
    : channelMessages;
  const activeThread = allThreads.find((m) => m.id === selectedThread) || allThreads[0];

  const sendMessage = () => {
    const text = messageInput.trim();
    if (!text) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, from: "You", fromRole: "Me", avatarColor: "oklch(0.535 0.195 245)", content: text, time: now, self: true }]);
    setMessageInput("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Communications</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">Secure messaging, channels, and team coordination</p>
        </div>
        <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700 shadow-blue-glow" onClick={() => openModal("sendAnnouncement")}>
          <Megaphone className="h-4 w-4 mr-1.5" />
          New Announcement
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[680px]">
        {/* Channels sidebar */}
        <Card className="lg:col-span-3 border-border/60 shadow-soft rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold">Channels</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {CHANNELS.map((channel) => {
              const count = MESSAGE_THREADS.filter((m) => m.channel === channel.id && m.unread).length;
              return (
                <button
                  key={channel.id}
                  onClick={() => {
                    setActiveChannel(channel.id);
                    setSelectedThread(null);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                    activeChannel === channel.id ? "bg-brand-50 text-brand-700" : "hover:bg-accent/50 text-foreground"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${channel.color}`}>
                    <channel.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{channel.label}</p>
                  </div>
                  {count > 0 && (
                    <span className="text-[10px] font-semibold bg-rose-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Thread list */}
        <Card className="lg:col-span-4 border-border/60 shadow-soft rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold capitalize">{activeChannel.replace("-", " ")}</h3>
              <Badge variant="outline" className="text-[10px]">{channelMessages.length} messages</Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search messages..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredMessages.length > 0 ? (
              filteredMessages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedThread(msg.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left ${
                    selectedThread === msg.id ? "bg-brand-50" : "hover:bg-accent/50"
                  }`}
                >
                  <ColorAvatar name={msg.from} color={msg.avatarColor} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className={`text-sm truncate ${msg.unread ? "font-semibold" : "font-medium"}`}>{msg.from}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">{msg.time}</span>
                    </div>
                    <p className={`text-xs truncate ${msg.unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {msg.preview}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{msg.fromRole}</p>
                  </div>
                  {msg.unread && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1" />}
                </button>
              ))
            ) : (
              <div className="p-8 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm font-medium">No messages yet</p>
                <p className="text-xs text-muted-foreground mt-1">Start a conversation in this channel</p>
              </div>
            )}
          </div>
        </Card>

        {/* Conversation view */}
        <Card className="lg:col-span-5 border-border/60 shadow-soft rounded-xl overflow-hidden flex flex-col">
          {activeThread ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ColorAvatar name={activeThread.from} color={activeThread.avatarColor} />
                  <div>
                    <p className="text-sm font-semibold">{activeThread.from}</p>
                    <p className="text-[11px] text-muted-foreground">{activeThread.fromRole} · Active now</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openModal("startCall")} aria-label="Phone call">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openModal("startCall")} aria-label="Video call">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => pushToast({ title: "More options (demo)", variant: "info" })} aria-label="More">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-accent/20">
                {SAMPLE_CONVERSATION.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-2.5 ${msg.self ? "flex-row-reverse" : ""}`}
                  >
                    {!msg.self && <ColorAvatar name={msg.from} color={msg.avatarColor} size="sm" />}
                    <div className={`max-w-[75%] ${msg.self ? "items-end" : ""}`}>
                      {!msg.self && (
                        <p className="text-[10px] text-muted-foreground mb-1 ml-1">{msg.from}</p>
                      )}
                      <div className={`px-3.5 py-2.5 rounded-2xl ${
                        msg.self
                          ? "bg-brand-600 text-white rounded-tr-sm"
                          : "bg-card border border-border rounded-tl-sm"
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                      <p className={`text-[10px] text-muted-foreground mt-1 ${msg.self ? "text-right mr-1" : "ml-1"}`}>{msg.time}</p>
                    </div>
                  </motion.div>
                ))}
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-2.5 flex-row-reverse"
                  >
                    <div className="max-w-[75%] items-end">
                      <div className="px-3.5 py-2.5 rounded-2xl bg-brand-600 text-white rounded-tr-sm">
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 text-right mr-1">{msg.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => pushToast({ title: "Feature coming soon", variant: "info" })} aria-label="Attach">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendMessage(); } }}
                    className="h-9 flex-1"
                  />
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => pushToast({ title: "Feature coming soon", variant: "info" })} aria-label="Emoji">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button size="sm" className="h-9 w-9 p-0 bg-brand-600 hover:bg-brand-700" onClick={sendMessage} aria-label="Send">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium">Select a conversation</p>
                <p className="text-xs text-muted-foreground mt-1">Choose a message from the list</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border/60 shadow-soft rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Start a call, invite teammates, or jump to your calendar</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => navigator.clipboard.writeText("med-core-tc-8x2k").then(() => pushToast({ title: "Copied", description: "Meeting ID copied to clipboard", variant: "success" }))}>
              Copy meeting ID
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => pushToast({ title: "Invite link copied", variant: "success" })}>
              Invite
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPage("appointments")}>
              View Calendar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
