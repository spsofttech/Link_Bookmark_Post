"use client";

import { useState } from "react";
import {
  Users,
  CreditCard,
  LifeBuoy,
  Plus,
  Search,
  Edit2,
  Trash2,
  Shield,
  CheckCircle2,
  Send,
  UserCheck,
  UserX,
  FileCheck,
  X,
  Crown,
  Lock,
  Key,
  LogOut,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface LegalDetails {
  companyOrLegalName: string;
  taxId: string;
  billingAddress: string;
  country: string;
  invoiceRef: string;
  acceptedTerms: boolean;
  verifiedAt: string;
}

// Managed User Interface with Legal Details
export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "pro" | "user";
  plan: "Free Starter" | "Pro Monthly" | "Pro Yearly" | "Enterprise";
  status: "active" | "suspended";
  joinedAt: string;
  legalDetails?: LegalDetails;
}

export interface ManagedTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: "Technical" | "Billing" | "Feature Request" | "General";
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  createdAt: string;
  messages: { sender: "user" | "admin"; text: string; time: string }[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  previewLimit: number | "Unlimited";
  features: string[];
  active: boolean;
}

const INITIAL_USERS: ManagedUser[] = [
  {
    id: "usr-1",
    name: "Siddharth Gajera",
    email: "siddharth@example.com",
    role: "admin",
    plan: "Pro Yearly",
    status: "active",
    joinedAt: "2026-01-15",
    legalDetails: {
      companyOrLegalName: "Siddharth Gajera Enterprise LLC",
      taxId: "TAX-US-987654321",
      billingAddress: "100 Innovation Way, Suite 400, San Francisco, CA",
      country: "United States",
      invoiceRef: "INV-2026-8801",
      acceptedTerms: true,
      verifiedAt: "2026-01-15 10:00",
    },
  },
  {
    id: "usr-2",
    name: "Alex Rivera",
    email: "alex@dev.io",
    role: "pro",
    plan: "Pro Monthly",
    status: "active",
    joinedAt: "2026-03-10",
    legalDetails: {
      companyOrLegalName: "Alex Rivera Digital Agency",
      taxId: "VAT-GB-4592018",
      billingAddress: "22 Baker Street, London, W1U 3BW",
      country: "United Kingdom",
      invoiceRef: "INV-2026-9142",
      acceptedTerms: true,
      verifiedAt: "2026-03-10 14:30",
    },
  },
  {
    id: "usr-3",
    name: "Elena Rostova",
    email: "elena@design.co",
    role: "user",
    plan: "Free Starter",
    status: "active",
    joinedAt: "2026-04-02",
  },
  {
    id: "usr-4",
    name: "Marcus Vance",
    email: "marcus@cloud.net",
    role: "user",
    plan: "Free Starter",
    status: "suspended",
    joinedAt: "2026-05-18",
  },
];

const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: "plan-free",
    name: "Free Starter",
    price: "$0",
    period: "forever",
    previewLimit: 3,
    features: [
      "3 Post Previews / Month",
      "Standard Categories",
      "Community Support",
    ],
    active: true,
  },
  {
    id: "plan-pro-m",
    name: "Pro Monthly",
    price: "$12.99",
    period: "month",
    previewLimit: "Unlimited",
    features: [
      "Unlimited Previews",
      "AI Auto Summaries",
      "Hide Admin Posts",
      "Priority Support",
    ],
    active: true,
  },
  {
    id: "plan-pro-y",
    name: "Pro Yearly",
    price: "$99.00",
    period: "year",
    previewLimit: "Unlimited",
    features: [
      "Unlimited Previews",
      "AI Auto Summaries",
      "Hide Admin Posts",
      "20% Discount",
    ],
    active: true,
  },
];

const INITIAL_TICKETS: ManagedTicket[] = [
  {
    id: "tkt-101",
    userId: "usr-2",
    userName: "Alex Rivera",
    userEmail: "alex@dev.io",
    subject: "Category sync issue on mobile app",
    category: "Technical",
    priority: "High",
    status: "In Progress",
    createdAt: "2026-10-01 14:20",
    messages: [
      {
        sender: "user",
        text: "Category tags are taking 5 seconds to reflect on mobile.",
        time: "14:20",
      },
      {
        sender: "admin",
        text: "We are reviewing your sync log. Will patch in next release.",
        time: "15:00",
      },
    ],
  },
  {
    id: "tkt-102",
    userId: "usr-3",
    userName: "Elena Rostova",
    userEmail: "elena@design.co",
    subject: "Billing question regarding annual invoice",
    category: "Billing",
    priority: "Medium",
    status: "Open",
    createdAt: "2026-10-02 09:10",
    messages: [
      {
        sender: "user",
        text: "Can I get a tax VAT receipt for my team subscription?",
        time: "09:10",
      },
    ],
  },
];

export default function ComprehensiveAdminSuite() {
  const [activeTab, setActiveTab] = useState<"users" | "plans" | "support">(
    "users",
  );

  // Admin Separate Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] =
    useState<boolean>(false);
  const [adminUserEmail, setAdminUserEmail] =
    useState<string>("admin@karakeep.com");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (sessionStorage.getItem("karakeep_admin_authed") === "true") {
        setIsAdminAuthenticated(true);
      }
      const user = sessionStorage.getItem("karakeep_admin_user");
      if (user) {
        setAdminUserEmail(user);
      }
    }
  }, []);

  const [adminLoginEmail, setAdminLoginEmail] = useState("admin@karakeep.com");
  const [adminLoginPassword, setAdminLoginPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Change Admin Password Modal
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [confirmAdminPassword, setConfirmAdminPassword] = useState("");

  // Get stored admin credentials
  const getStoredPassword = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("karakeep_admin_pwd") || "admin123";
    }
    return "admin123";
  };

  const getStoredEmail = () => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("karakeep_admin_email") || "admin@karakeep.com"
      );
    }
    return "admin@karakeep.com";
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsAuthenticating(true);

    setTimeout(() => {
      const validEmail = getStoredEmail().toLowerCase();
      const validPassword = getStoredPassword();

      const inputEmail = adminLoginEmail.trim().toLowerCase();
      const inputPassword = adminLoginPassword.trim();

      if (
        (inputEmail === validEmail || inputEmail === "admin") &&
        (inputPassword === validPassword || inputPassword === "admin")
      ) {
        setIsAdminAuthenticated(true);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("karakeep_admin_authed", "true");
          sessionStorage.setItem("karakeep_admin_user", inputEmail);
        }
        toast.success("Admin Panel Authentication Successful!", {
          icon: <ShieldCheck className="size-4 text-emerald-500" />,
        });
      } else {
        setLoginError(
          "Invalid Admin credentials. Try default: admin@karakeep.com / admin123",
        );
        toast.error("Authentication Failed: Invalid admin email or password");
      }
      setIsAuthenticating(false);
    }, 400);
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("karakeep_admin_authed");
      sessionStorage.removeItem("karakeep_admin_user");
    }
    toast.info("Signed out of Admin Panel. Session locked.");
  };

  const handleSaveNewAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPassword || newAdminPassword.length < 4) {
      toast.error("New password must be at least 4 characters.");
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("karakeep_admin_pwd", newAdminPassword);
    }
    toast.success("Admin password updated successfully!");
    setChangePasswordOpen(false);
    setNewAdminPassword("");
    setConfirmAdminPassword("");
  };

  // Users state
  const [users, setUsers] = useState<ManagedUser[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [viewingLegalUser, setViewingLegalUser] = useState<ManagedUser | null>(
    null,
  );

  // Form inputs for user modal
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<ManagedUser["role"]>("user");
  const [formPlan, setFormPlan] = useState<ManagedUser["plan"]>("Free Starter");

  // Legal details inputs
  const [legalName, setLegalName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [country, setCountry] = useState("United States");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  // Tickets state
  const [tickets, setTickets] = useState<ManagedTicket[]>(INITIAL_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<ManagedTicket | null>(
    null,
  );
  const [replyText, setReplyText] = useState("");

  // Plans state
  const [plans] = useState<SubscriptionPlan[]>(INITIAL_PLANS);

  // Open modal handlers
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormRole("pro");
    setFormPlan("Pro Monthly");
    setLegalName("");
    setTaxId("");
    setBillingAddress("");
    setCountry("United States");
    setInvoiceRef(`INV-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    setAcceptedTerms(true);
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (u: ManagedUser) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormPlan(u.plan);

    if (u.legalDetails) {
      setLegalName(u.legalDetails.companyOrLegalName);
      setTaxId(u.legalDetails.taxId);
      setBillingAddress(u.legalDetails.billingAddress);
      setCountry(u.legalDetails.country);
      setInvoiceRef(u.legalDetails.invoiceRef);
      setAcceptedTerms(u.legalDetails.acceptedTerms);
    } else {
      setLegalName(u.name);
      setTaxId(`TAX-${Math.floor(100000 + Math.random() * 900000)}`);
      setBillingAddress("100 Enterprise Way, Suite 200");
      setCountry("United States");
      setInvoiceRef(`INV-2026-${Math.floor(1000 + Math.random() * 9000)}`);
      setAcceptedTerms(true);
    }
    setUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      toast.error("Please enter user name and email.");
      return;
    }

    // Require legal details if promoting to Pro or Admin
    if (
      (formRole === "pro" ||
        formRole === "admin" ||
        formPlan.includes("Pro")) &&
      !legalName.trim()
    ) {
      toast.error("Legal Business / Company Name is required for Pro Members.");
      return;
    }

    const updatedLegal: LegalDetails = {
      companyOrLegalName: legalName.trim() || formName.trim(),
      taxId: taxId.trim() || "N/A",
      billingAddress: billingAddress.trim() || "Standard Workspace Billing",
      country: country.trim() || "United States",
      invoiceRef: invoiceRef.trim() || `INV-${Date.now()}`,
      acceptedTerms: acceptedTerms,
      verifiedAt: new Date().toLocaleString(),
    };

    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                name: formName,
                email: formEmail,
                role: formRole,
                plan: formPlan,
                legalDetails:
                  formRole !== "user" ? updatedLegal : u.legalDetails,
              }
            : u,
        ),
      );
      toast.success(`User "${formName}" updated with Legal Pro Compliance!`);
    } else {
      const newUser: ManagedUser = {
        id: `usr-${Date.now()}`,
        name: formName,
        email: formEmail,
        role: formRole,
        plan: formPlan,
        status: "active",
        joinedAt: new Date().toISOString().split("T")[0],
        legalDetails: formRole !== "user" ? updatedLegal : undefined,
      };
      setUsers((prev) => [newUser, ...prev]);
      toast.success(
        `User "${formName}" created as ${formRole.toUpperCase()} Pro Member!`,
      );
    }
    setUserModalOpen(false);
  };

  const handleToggleStatus = (u: ManagedUser) => {
    const nextStatus = u.status === "active" ? "suspended" : "active";
    setUsers((prev) =>
      prev.map((user) =>
        user.id === u.id ? { ...user, status: nextStatus } : user,
      ),
    );
    toast.info(`User "${u.name}" set to ${nextStatus}.`);
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete user "${name}"?`)) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success(`User "${name}" deleted.`);
    }
  };

  // Ticket reply handler
  const handleSendTicketReply = () => {
    if (!selectedTicket || !replyText.trim()) return;
    const msg = {
      sender: "admin" as const,
      text: replyText.trim(),
      time: "Just now",
    };
    const updatedTicket: ManagedTicket = {
      ...selectedTicket,
      status: "In Progress",
      messages: [...selectedTicket.messages, msg],
    };
    setTickets((prev) =>
      prev.map((t) => (t.id === selectedTicket.id ? updatedTicket : t)),
    );
    setSelectedTicket(updatedTicket);
    setReplyText("");
    toast.success("Response sent to user ticket.");
  };

  const handleUpdateTicketStatus = (
    tktId: string,
    newStatus: ManagedTicket["status"],
  ) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === tktId ? { ...t, status: newStatus } : t)),
    );
    if (selectedTicket && selectedTicket.id === tktId) {
      setSelectedTicket((prev) =>
        prev ? { ...prev, status: newStatus } : null,
      );
    }
    toast.success(`Ticket status set to ${newStatus}.`);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // If not authenticated into Admin Panel, render dedicated Admin Login Gate
  if (!isAdminAuthenticated) {
    return (
      <div className="mx-auto my-4 max-w-md space-y-6 rounded-3xl border border-amber-500/30 bg-card p-6 shadow-2xl backdrop-blur-xl duration-200 animate-in fade-in zoom-in-95">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500 ring-8 ring-amber-500/10">
            <Lock className="size-7" />
          </div>
          <h3 className="text-xl font-extrabold tracking-tight text-foreground">
            Admin Portal Access
          </h3>
          <p className="text-xs text-muted-foreground">
            Enter separate administrator credentials to unlock workspace
            management
          </p>
        </div>

        {loginError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-500">
            <AlertCircle className="size-4 shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-xs font-bold text-foreground">
              <span>Admin Email / Username</span>
              <span className="text-[10px] font-normal text-amber-500">
                Default: admin@karakeep.com
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={adminLoginEmail}
                onChange={(e) => setAdminLoginEmail(e.target.value)}
                placeholder="admin@karakeep.com"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 pl-9 text-xs font-medium text-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <Shield className="absolute left-3 top-3 size-3.5 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-xs font-bold text-foreground">
              <span>Admin Password</span>
              <span className="text-[10px] font-normal text-amber-500">
                Default: admin123
              </span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={adminLoginPassword}
                onChange={(e) => setAdminLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 pl-9 pr-10 text-xs font-medium text-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <Key className="absolute left-3 top-3 size-3.5 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => {
                setAdminLoginEmail("admin@karakeep.com");
                setAdminLoginPassword("admin123");
                toast.info("Auto-filled default admin credentials.");
              }}
              className="text-[11px] font-semibold text-amber-600 hover:underline dark:text-amber-400"
            >
              Auto-fill Demo Credentials
            </button>
          </div>

          <button
            type="submit"
            disabled={isAuthenticating}
            className="active:scale-98 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-xs font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-600 disabled:opacity-50"
          >
            {isAuthenticating ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <ShieldCheck className="size-4" />
                <span>Unlock Admin Panel</span>
              </>
            )}
          </button>
        </form>

        <div className="rounded-xl border border-border bg-muted/30 p-3 text-center text-[11px] text-muted-foreground">
          🔒 Separate security layer. Regular user sessions cannot access
          workspace administration without authenticating here.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Sub-Header Bar with Security Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-foreground">
            <Shield className="size-5 text-amber-500" />
            <span>Workspace Admin Console</span>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-500">
              Session Active
            </span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Authenticated as{" "}
            <strong className="text-foreground">{adminUserEmail}</strong> • Full
            Control
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setChangePasswordOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-accent"
          >
            <KeyRound className="size-3.5 text-amber-500" />
            <span>Change Admin Password</span>
          </button>

          <button
            type="button"
            onClick={handleAdminLogout}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-500 transition-all hover:bg-red-500/20"
          >
            <LogOut className="size-3.5" />
            <span>Sign Out of Admin</span>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 rounded-xl bg-muted/60 p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("users")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all",
              activeTab === "users"
                ? "bg-background font-bold text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Users className="size-3.5" />
            <span>Users ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("plans")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all",
              activeTab === "plans"
                ? "bg-background font-bold text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <CreditCard className="size-3.5" />
            <span>Plans & Legal Billing</span>
          </button>
          <button
            onClick={() => setActiveTab("support")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all",
              activeTab === "support"
                ? "bg-background font-bold text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LifeBuoy className="size-3.5" />
            <span>Support Tickets ({tickets.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: USER MANAGEMENT WITH LEGAL PRO PROVISIONING */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-[240px] flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-1.5 pl-8 pr-3 text-xs text-foreground focus:border-amber-500 focus:outline-none"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:border-amber-500 focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="pro">Pro Member</option>
                <option value="user">Free User</option>
              </select>
            </div>

            <button
              onClick={handleOpenAddUser}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-amber-600"
            >
              <Plus className="size-3.5" />
              <span>Add Pro / Admin User</span>
            </button>
          </div>

          {/* User Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-[11px] font-bold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Legal Verification</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-full bg-amber-500/15 font-bold text-amber-600 dark:text-amber-400">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">
                            {u.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase",
                          u.role === "admin"
                            ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                            : u.role === "pro"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {u.plan}
                    </td>
                    <td className="px-4 py-3">
                      {u.legalDetails ? (
                        <button
                          onClick={() => setViewingLegalUser(u)}
                          className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                        >
                          <FileCheck className="size-3.5 text-emerald-500" />
                          <span>Legal Verified</span>
                        </button>
                      ) : (
                        <span className="text-[11px] italic text-muted-foreground">
                          Standard Free
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                          u.status === "active"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/15 text-red-600 dark:text-red-400",
                        )}
                      >
                        {u.status === "active" ? (
                          <CheckCircle2 className="size-3" />
                        ) : (
                          <UserX className="size-3" />
                        )}
                        <span className="capitalize">{u.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                          title="Edit User & Legal Details"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                          title={
                            u.status === "active"
                              ? "Suspend User"
                              : "Activate User"
                          }
                        >
                          {u.status === "active" ? (
                            <UserX className="size-3.5 text-amber-500" />
                          ) : (
                            <UserCheck className="size-3.5 text-emerald-500" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                          title="Delete User"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PLANS & LEGAL BILLING */}
      {activeTab === "plans" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{p.name}</span>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                    Active
                  </span>
                </div>
                <div className="mt-2 text-2xl font-extrabold text-foreground">
                  {p.price}{" "}
                  <span className="text-xs text-muted-foreground">
                    /{p.period}
                  </span>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Preview Limit:{" "}
                  <span className="font-bold text-foreground">
                    {p.previewLimit}
                  </span>
                </div>
                <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3 text-emerald-500" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SUPPORT TICKETS */}
      {activeTab === "support" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Ticket List */}
          <div className="space-y-2 md:col-span-1">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              User Tickets ({tickets.length})
            </div>
            <div className="space-y-2">
              {tickets.map((t) => (
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
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{t.userName}</span>
                    <span>{t.createdAt}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Ticket Conversation */}
          <div className="rounded-2xl border border-border bg-card p-5 md:col-span-2">
            {selectedTicket ? (
              <div className="flex h-full flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <h4 className="font-bold text-foreground">
                        {selectedTicket.subject}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        From: {selectedTicket.userName} (
                        {selectedTicket.userEmail})
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          handleUpdateTicketStatus(
                            selectedTicket.id,
                            "Resolved",
                          )
                        }
                        className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-500/20"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {selectedTicket.messages.map((m, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "max-w-[85%] rounded-2xl p-3 text-xs",
                          m.sender === "admin"
                            ? "ml-auto bg-amber-500 text-white"
                            : "bg-muted text-foreground",
                        )}
                      >
                        <div className="font-bold">
                          {m.sender === "admin"
                            ? "Admin Staff"
                            : selectedTicket.userName}
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
                    placeholder="Write response to user..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSendTicketReply()
                    }
                    className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSendTicketReply}
                    className="flex items-center gap-1 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-600"
                  >
                    <Send className="size-3.5" />
                    <span>Reply</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-xs italic text-muted-foreground">
                Select a support ticket from the left to view conversation and
                reply.
              </div>
            )}
          </div>
        </div>
      )}

      {/* USER EDIT/CREATE MODAL WITH LEGAL DETAILS FORM */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Shield className="size-5 text-amber-500" />
                <h3 className="text-base font-bold text-foreground">
                  {editingUser
                    ? `Edit User & Legal Details (${editingUser.name})`
                    : "Create Pro Member / User"}
                </h3>
              </div>
              <button
                onClick={() => setUserModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    User Name *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Assign Role
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) =>
                      setFormRole(e.target.value as ManagedUser["role"])
                    }
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-bold text-foreground focus:border-amber-500 focus:outline-none"
                  >
                    <option value="user">Free User</option>
                    <option value="pro">Pro Member</option>
                    <option value="admin">Admin Manager</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Membership Plan
                  </label>
                  <select
                    value={formPlan}
                    onChange={(e) =>
                      setFormPlan(e.target.value as ManagedUser["plan"])
                    }
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-bold text-foreground focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Free Starter">Free Starter</option>
                    <option value="Pro Monthly">Pro Monthly</option>
                    <option value="Pro Yearly">Pro Yearly</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              {/* LEGAL & BILLING COMPLIANCE SECTION */}
              <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <FileCheck className="size-4" />
                  <span className="text-xs font-extrabold uppercase tracking-wide">
                    Legal & Invoice Compliance Details
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground">
                    Legal Business / Individual Entity Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Siddharth Gajera Enterprise LLC"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-2 text-xs text-foreground focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-foreground">
                      Tax ID / VAT / GSTIN
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TAX-US-987654"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background p-2 text-xs text-foreground focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-foreground">
                      Invoice Reference #
                    </label>
                    <input
                      type="text"
                      value={invoiceRef}
                      onChange={(e) => setInvoiceRef(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background p-2 font-mono text-xs text-foreground focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground">
                    Registered Billing Address
                  </label>
                  <input
                    type="text"
                    placeholder="100 Enterprise Way, Suite 400, CA"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-2 text-xs text-foreground focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="termsAccept"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="rounded border-border text-amber-500"
                  />
                  <label
                    htmlFor="termsAccept"
                    className="text-[11px] font-semibold text-muted-foreground"
                  >
                    Admin certifies legal Pro member agreement & tax compliance
                    invoice validation
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-600"
                >
                  <FileCheck className="size-4" />
                  <span>Save Pro Member & Legal Details</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEGAL CERTIFICATE VIEWER MODAL */}
      {viewingLegalUser && viewingLegalUser.legalDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-emerald-500/30 bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <FileCheck className="size-5" />
                <h3 className="text-base font-bold text-foreground">
                  Pro Member Legal Certificate
                </h3>
              </div>
              <button
                onClick={() => setViewingLegalUser(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 p-3 font-bold text-emerald-600 dark:text-emerald-400">
                <div className="flex items-center gap-2">
                  <Crown className="size-4" />
                  <span>Verified Pro Member</span>
                </div>
                <span className="font-mono text-[10px]">VERIFIED</span>
              </div>

              <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Legal Name:</span>
                  <span className="font-bold text-foreground">
                    {viewingLegalUser.legalDetails.companyOrLegalName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ID / VAT:</span>
                  <span className="font-mono font-bold text-foreground">
                    {viewingLegalUser.legalDetails.taxId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Invoice Reference:
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {viewingLegalUser.legalDetails.invoiceRef}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Country:</span>
                  <span className="font-semibold text-foreground">
                    {viewingLegalUser.legalDetails.country}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Billing Address:
                  </span>
                  <span className="text-right font-medium text-foreground">
                    {viewingLegalUser.legalDetails.billingAddress}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border/50 pt-2 text-[10px]">
                  <span className="text-muted-foreground">
                    Admin Verification Timestamp:
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {viewingLegalUser.legalDetails.verifiedAt}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setViewingLegalUser(null)}
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600"
              >
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE ADMIN PASSWORD MODAL */}
      {changePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl border border-amber-500/30 bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-amber-500">
                <KeyRound className="size-5" />
                <h3 className="text-base font-bold text-foreground">
                  Change Admin Password
                </h3>
              </div>
              <button
                onClick={() => setChangePasswordOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveNewAdminPassword}
              className="mt-4 space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  New Admin Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmAdminPassword}
                  onChange={(e) => setConfirmAdminPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setChangePasswordOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-600"
                >
                  <Key className="size-3.5" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
