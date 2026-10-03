"use client";

import { useState } from "react";
import { LifeBuoy, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface UserSupportTicket {
  id: string;
  subject: string;
  category: "Technical" | "Billing" | "Feature Request" | "General";
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  createdAt: string;
  description: string;
  replies: { sender: "user" | "admin"; text: string; time: string }[];
}

const INITIAL_USER_TICKETS: UserSupportTicket[] = [
  {
    id: "tkt-201",
    subject: "Need help setting up custom AI prompt template",
    category: "Technical",
    priority: "Medium",
    status: "In Progress",
    createdAt: "2026-10-02 10:15",
    description:
      "I want to extract custom JSON keys when auto-summarizing bookmark posts.",
    replies: [
      {
        sender: "user",
        text: "I want to extract custom JSON keys when auto-summarizing bookmark posts.",
        time: "10:15",
      },
      {
        sender: "admin",
        text: "Hi! You can customize system prompts in Settings > AI & Smart Tagging.",
        time: "11:30",
      },
    ],
  },
];

export function UserSupportSection() {
  const [tickets, setTickets] =
    useState<UserSupportTicket[]>(INITIAL_USER_TICKETS);
  const [selectedTicket, setSelectedTicket] =
    useState<UserSupportTicket | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // New ticket form
  const [subject, setSubject] = useState("");
  const [category, setCategory] =
    useState<UserSupportTicket["category"]>("General");
  const [priority, setPriority] =
    useState<UserSupportTicket["priority"]>("Medium");
  const [description, setDescription] = useState("");

  // Reply form
  const [replyMsg, setReplyMsg] = useState("");

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in subject and description.");
      return;
    }

    const newTicket: UserSupportTicket = {
      id: `tkt-${Date.now().toString().slice(-4)}`,
      subject: subject.trim(),
      category,
      priority,
      status: "Open",
      createdAt: new Date().toLocaleString(),
      description: description.trim(),
      replies: [{ sender: "user", text: description.trim(), time: "Just now" }],
    };

    setTickets((prev) => [newTicket, ...prev]);
    setSelectedTicket(newTicket);
    setIsCreating(false);
    setSubject("");
    setDescription("");
    toast.success("Support ticket created! Admin team will reply shortly.");
  };

  const handleSendReply = () => {
    if (!selectedTicket || !replyMsg.trim()) return;
    const reply = {
      sender: "user" as const,
      text: replyMsg.trim(),
      time: "Just now",
    };
    const updated: UserSupportTicket = {
      ...selectedTicket,
      replies: [...selectedTicket.replies, reply],
    };
    setTickets((prev) =>
      prev.map((t) => (t.id === selectedTicket.id ? updated : t)),
    );
    setSelectedTicket(updated);
    setReplyMsg("");
    toast.success("Reply added to ticket.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
            <LifeBuoy className="size-5 text-amber-500" />
            <span>Help & Support Center</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Raise issues, submit feature requests, or talk to Karakeep support
            staff
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-amber-600"
        >
          <Plus className="size-3.5" />
          <span>New Support Ticket</span>
        </button>
      </div>

      {isCreating ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h4 className="font-bold text-foreground">Create Support Ticket</h4>
          <form onSubmit={handleCreateTicket} className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground">
                Subject
              </label>
              <input
                type="text"
                placeholder="Brief summary of issue or question..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as UserSupportTicket["category"])
                  }
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:border-amber-500 focus:outline-none"
                >
                  <option value="General">General Question</option>
                  <option value="Technical">Technical Issue</option>
                  <option value="Billing">Billing & Plan</option>
                  <option value="Feature Request">Feature Request</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as UserSupportTicket["priority"])
                  }
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:border-amber-500 focus:outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">
                Description
              </label>
              <textarea
                rows={4}
                placeholder="Describe your issue or feedback in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600"
              >
                Submit Ticket
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Ticket List */}
          <div className="space-y-2 md:col-span-1">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Your Support Tickets ({tickets.length})
            </div>
            {tickets.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs italic text-muted-foreground">
                No support tickets created yet.
              </p>
            ) : (
              tickets.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={cn(
                    "w-full cursor-pointer rounded-2xl border p-3.5 text-left transition-all",
                    selectedTicket?.id === t.id
                      ? "border-amber-500 bg-amber-500/10 shadow-sm"
                      : "border-border bg-card hover:border-border/80",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {t.id}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        t.status === "Open"
                          ? "bg-amber-500/15 text-amber-600"
                          : t.status === "In Progress"
                            ? "bg-blue-500/15 text-blue-600"
                            : "bg-emerald-500/15 text-emerald-600",
                      )}
                    >
                      {t.status}
                    </span>
                  </div>
                  <div className="mt-1 font-semibold text-foreground">
                    {t.subject}
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    {t.createdAt}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Ticket Conversation View */}
          <div className="rounded-2xl border border-border bg-card p-5 md:col-span-2">
            {selectedTicket ? (
              <div className="flex h-full flex-col justify-between space-y-4">
                <div>
                  <div className="border-b border-border pb-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-foreground">
                        {selectedTicket.subject}
                      </h4>
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {selectedTicket.category} • {selectedTicket.priority}{" "}
                        Priority
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {selectedTicket.replies.map((m, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "max-w-[85%] rounded-2xl p-3 text-xs",
                          m.sender === "user"
                            ? "ml-auto bg-amber-500 text-white"
                            : "border border-border bg-muted text-foreground",
                        )}
                      >
                        <div className="font-bold">
                          {m.sender === "user"
                            ? "You"
                            : "Karakeep Support Staff"}
                        </div>
                        <div className="mt-1">{m.text}</div>
                        <div className="mt-1 text-right text-[10px] opacity-75">
                          {m.time}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-border pt-3">
                  <input
                    type="text"
                    placeholder="Type a message to support..."
                    value={replyMsg}
                    onChange={(e) => setReplyMsg(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                    className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSendReply}
                    className="flex items-center gap-1 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-600"
                  >
                    <Send className="size-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-xs italic text-muted-foreground">
                Select a support ticket to view conversation or create a new
                ticket.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
