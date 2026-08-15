import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  CheckCircle2,
  Clock,
  Headphones,
  Mail,
  MapPin,
  Menu,
  MonitorSmartphone,
  Phone,
  RotateCcw,
  Shield,
  ShoppingBag,
  Store,
  X,
  Zap,
} from "lucide-react";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const NAV = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#roles", label: "Who it's for" },
  { href: "#contact", label: "Contact" },
];

/** Contact details shown on the public landing page. */
const CONTACT = {
  address: "KN 4 Ave, Kigali Heights, 3rd Floor, Kigali, Rwanda",
  phone: "+250 788 555 010",
  phoneHref: "tel:+250788555010",
  email: "hello@posify.com",
  hours: "Mon–Sat, 08:00–18:00 CAT",
};

const FEATURES = [
  {
    icon: MonitorSmartphone,
    title: "Fast POS terminal",
    body: "Cashiers ring up cash, card, and UPI in seconds — barcode-ready checkout, live cart totals, and receipts without leaving the counter.",
  },
  {
    icon: Building2,
    title: "Multi-tenant stores",
    body: "Each retailer is an isolated tenant. Super admins onboard shops; store teams run their own catalog, staff, and branches.",
  },
  {
    icon: Store,
    title: "Branches that stay in sync",
    body: "Open as many locations as you need. Stock, orders, and staff stay scoped to the right branch so nothing leaks across shops.",
  },
  {
    icon: Boxes,
    title: "Live inventory",
    body: "Track what each branch actually has. Sales deduct stock automatically so you stop selling what you cannot fulfill.",
  },
  {
    icon: Clock,
    title: "Shifts & cash-up",
    body: "Cashiers open and close shifts with a full report: orders processed, cash collected, and duration — ready for the manager.",
  },
  {
    icon: RotateCcw,
    title: "Refunds under control",
    body: "Process returns from the same terminal with a clear trail, so the till and inventory stay honest after a sale is reversed.",
  },
  {
    icon: BarChart3,
    title: "Analytics you can act on",
    body: "Revenue, order volume, and top products across the platform or a single store — not a spreadsheet you update at midnight.",
  },
  {
    icon: ShoppingBag,
    title: "Customer portal",
    body: "Shoppers browse the catalog, place orders, and follow their history — the same products your cashiers sell in-store.",
  },
  {
    icon: Shield,
    title: "Role-based access",
    body: "Super admin, store admin, store manager, branch manager, cashier, and customer each see only what they need.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Onboard the tenant",
    body: "Create the store, brand, and first admin. The platform keeps every retailer’s data in its own workspace.",
  },
  {
    step: "02",
    title: "Set up catalog & people",
    body: "Add categories, products, branches, and employees. Managers assign cashiers to the counters they actually work.",
  },
  {
    step: "03",
    title: "Sell on the floor",
    body: "A cashier opens a shift, scans or searches items, takes payment, and prints or shares a receipt. Inventory updates immediately.",
  },
  {
    step: "04",
    title: "Review and grow",
    body: "Close the shift, check refunds, restock the branch, and read analytics — then open the next location on the same system.",
  },
];

const ROLES = [
  {
    title: "Retail owners & store admins",
    expect: [
      "One console for every branch",
      "Product and category catalog",
      "Hire and assign employees",
      "Sales performance at a glance",
    ],
  },
  {
    title: "Branch managers",
    expect: [
      "Inventory that matches the shelf",
      "Order history for the location",
      "Shift oversight for the team",
      "Staff who can only access this branch",
    ],
  },
  {
    title: "Cashiers",
    expect: [
      "A dedicated POS terminal",
      "Cash, card, and UPI checkout",
      "Shift open/close with a cash-up report",
      "Refunds without leaving the till",
    ],
  },
  {
    title: "Shoppers",
    expect: [
      "Browse the store catalog online",
      "Place and track orders",
      "A simple profile for repeat visits",
    ],
  },
];

const EXPECT = [
  "Checkout that keeps the queue moving",
  "Stock numbers you can trust after every sale",
  "Separate workspaces so competitors never share data",
  "Staff logins that cannot wander into the wrong role",
  "Shift reports instead of handwritten till sheets",
  "A customer-facing shop that uses the same catalog",
];

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const onContact = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      (e.target as HTMLFormElement).reset();
      toast.success("Message sent. We will get back to you shortly.");
    }, 700);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <BrandLogo size="md" />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="transition-colors hover:text-foreground">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/apply-store">For stores</Link>
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-[var(--primary-hover)]" asChild>
              <Link to="/signup">Shop with us</Link>
            </Button>
          </div>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-lg border md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
          </div>
        </div>
        {menuOpen && (
          <div className="border-t bg-background px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3 text-sm font-medium">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-2 py-2 hover:bg-muted"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-2 flex gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button className="flex-1 bg-primary text-primary-foreground hover:bg-[var(--primary-hover)]" asChild>
                  <Link to="/signup">Get started</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 landing-hero-glow opacity-[0.08]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="landing-fade-up inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-primary">
              <span className="relative flex size-2">
                <span className="landing-pulse-ring absolute inline-flex size-full rounded-full bg-primary" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              Multi-tenant point of sale for retailers
            </span>
            <h1 className="landing-fade-up landing-delay-1 mt-5 font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              One system to run the shop, every branch, and every till.
            </h1>
            <p className="landing-fade-up landing-delay-2 mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              POSify is a SaaS selling platform for retailers and shops. Super admins onboard tenants.
              Store teams manage products and people. Cashiers sell with a fast terminal. Customers can
              shop the same catalog online.
            </p>
            <div className="landing-fade-up landing-delay-3 mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-[var(--primary-hover)]" asChild>
                <Link to="/signup">
                  Create a shopper account
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/apply-store">Do you have a store and want to boost your productivity?</Link>
              </Button>
            </div>
            <p className="landing-fade-up landing-delay-4 mt-4 text-xs text-muted-foreground">
              Built for multi-store retail — not a single cash register app.
            </p>
          </div>
          <div className="landing-fade-up landing-delay-2 relative">
            <div className="landing-float overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-[#0F172A]/15">
              <img
                src="/landing-hero.jpg"
                alt="Cashier completing a sale on a POSify terminal"
                className="h-[280px] w-full object-cover sm:h-[360px] lg:h-[420px]"
              />
            </div>
            <div className="absolute -bottom-5 left-4 right-4 grid grid-cols-3 gap-2 sm:left-8 sm:right-auto sm:w-[320px]">
              {[
                { label: "Checkout", value: "< 8s" },
                { label: "Payments", value: "Cash · Card · UPI" },
                { label: "Tenants", value: "Isolated" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                  <p className="mt-0.5 text-xs font-semibold sm:text-sm">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y bg-[#0F172A] text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {[
            { n: "6", l: "roles, one platform" },
            { n: "3", l: "payment types at till" },
            { n: "∞", l: "branches per store" },
            { n: "24/7", l: "support hours" },
          ].map((s) => (
            <div key={s.l} className="text-center lg:text-left">
              <p className="font-display text-3xl font-bold text-primary">{s.n}</p>
              <p className="mt-1 text-sm text-slate-300">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="product" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">What POSify does</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">The whole selling system, not just a till.</h2>
          <p className="mt-4 text-muted-foreground">
            Retailers get a workspace. Shops get branches. Cashiers get a terminal. Managers get stock,
            shifts, and numbers. Customers get a portal. That is the product — one SaaS stack instead of
            five disconnected tools.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="group rounded-2xl border bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-muted/50">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border shadow-lg">
            <img
              src="/landing-inventory.jpg"
              alt="Retail inventory and store aisle managed through POSify"
              className="h-[280px] w-full object-cover sm:h-[380px]"
            />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">For retailers & shops</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">What you should expect on day one.</h2>
            <ul className="mt-6 space-y-3">
              {EXPECT.map((item) => (
                <li key={item} className="flex gap-3 text-sm sm:text-base">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">How it works</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">From tenant to till in four steps.</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {STEPS.map((s) => (
            <div key={s.step} className="relative overflow-hidden rounded-2xl border bg-card p-6">
              <span className="font-display text-5xl font-extrabold text-primary/20">{s.step}</span>
              <h3 className="mt-2 font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 overflow-hidden rounded-2xl border">
          <img
            src="/landing-analytics.jpg"
            alt="Store manager reviewing live sales analytics"
            className="h-[240px] w-full object-cover sm:h-[360px]"
          />
        </div>
      </section>

      <section id="roles" className="scroll-mt-20 bg-[#0B1120] py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-end gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">Who it is for</p>
              <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Everyone in the shop has a seat.</h2>
            </div>
            <p className="text-sm text-slate-400">
              POSify does not dump every screen on every user. Logins are role-based so a cashier cannot
              rewrite the catalog, and a customer cannot open the till.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {ROLES.map((r) => (
              <article key={r.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="font-display text-lg font-semibold">{r.title}</h3>
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  {r.expect.map((e) => (
                    <li key={e} className="flex gap-2">
                      <Zap className="mt-0.5 size-4 shrink-0 text-[#F59E0B]" />
                      {e}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-10 overflow-hidden rounded-2xl border border-white/10">
            <img
              src="/landing-retailers.jpg"
              alt="Retailer serving a customer at the counter"
              className="h-[240px] w-full object-cover sm:h-[340px]"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="rounded-3xl bg-primary px-6 py-12 text-primary-foreground sm:px-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1.4fr_auto]">
            <div>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">Ready to run retail from one login?</h2>
              <p className="mt-3 max-w-xl text-sm sm:text-base opacity-80">
                Create a workspace, invite your team, and put a terminal on the counter.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="bg-[#0F172A] text-white hover:bg-[#0F172A]/90" asChild>
                <Link to="/signup">Create an account</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-[#0F172A]/20 bg-white/40 hover:bg-white" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-20 border-t bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Contact</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Talk to the POSify team.</h2>
            <p className="mt-3 text-muted-foreground">
              Reach the POSify team with the details below.
            </p>
            <div className="mt-8 space-y-5">
              <ContactRow icon={MapPin} label="HQ" value={CONTACT.address} />
              <ContactRow icon={Phone} label="Phone" value={CONTACT.phone} href={CONTACT.phoneHref} />
              <ContactRow icon={Mail} label="Email" value={CONTACT.email} href={`mailto:${CONTACT.email}`} />
              <ContactRow icon={Headphones} label="Support hours" value={CONTACT.hours} />
            </div>
          </div>
          <form onSubmit={onContact} className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
            <h3 className="font-display text-lg font-semibold">Send a message</h3>
            <p className="mt-1 text-sm text-muted-foreground">This form does not email anyone yet. It is here so you can restyle and wire it later.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" name="name" placeholder="Ada Okonkwo" />
              <Field label="Shop / company" name="company" placeholder="AdaMart Ltd" />
              <Field label="Email" name="email" type="email" placeholder="ada@adamart.com" className="sm:col-span-2" />
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Message
                </label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  placeholder="We have 4 branches and need POS + inventory…"
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={sending}
              className="mt-5 w-full bg-[#0F172A] text-white hover:bg-[#0F172A]/90 sm:w-auto"
            >
              {sending ? "Sending…" : "Send message"}
            </Button>
          </form>
        </div>
      </section>

      <footer className="border-t bg-[#0F172A] text-slate-300">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div>
            <BrandLogo inverted to="/" />
            <p className="mt-3 max-w-xs text-sm text-slate-400">
              Multi-tenant POS for retailers — terminals, inventory, shifts, and a customer portal in one place.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm">
            <div>
              <p className="font-semibold text-white">Product</p>
              <ul className="mt-3 space-y-2">
                <li><a href="#product" className="hover:text-white">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white">How it works</a></li>
                <li><a href="#roles" className="hover:text-white">Roles</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white">Account</p>
              <ul className="mt-3 space-y-2">
                <li><Link to="/login" className="hover:text-white">Sign in</Link></li>
                <li><Link to="/signup" className="hover:text-white">Create account</Link></li>
                <li><a href="#contact" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-500 sm:px-6">
            © {new Date().getFullYear()} POSify. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  className,
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <input
        name={name}
        type={type}
        required
        placeholder={placeholder}
        className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2"
      />
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
}) {
  const content = href ? (
    <a href={href} className="hover:text-primary">
      {value}
    </a>
  ) : (
    value
  );
  return (
    <div className="flex gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{content}</p>
      </div>
    </div>
  );
}
