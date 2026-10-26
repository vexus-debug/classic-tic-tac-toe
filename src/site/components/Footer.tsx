import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Globe, ShieldCheck } from "lucide-react";
import clinexusLogoWhite from "@/assets/site/clinexus-logo-white.png";

const columns = [
  { title: "Solutions", links: [
    { label: "Eye clinics", to: "/industries/eye-clinics" },
    { label: "Dental clinics", to: "/industries/dental-clinics" },
    { label: "Dental clinic pricing", to: "/industries/dental-clinics/pricing" },
  ]},
  { title: "Resources", links: [
    { label: "Tutorials", to: "/tutorials" },
    { label: "Articles", to: "/articles" },
    { label: "Updates", to: "/updates" },
    { label: "All industries", to: "/industries" },
  ]},
  { title: "Company", links: [
    { label: "About", to: "/about" },
    { label: "Contact", to: "/contact" },
    { label: "Log in", to: "/login" },
  ]},
  { title: "Legal", links: [
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Terms of Service", to: "/terms" },
    { label: "Cookie Policy", to: "/cookies" },
  ]},
];

const Footer = () => {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <footer className="site-footer border-t border-border bg-card text-foreground">
      <div className="container">
        <div className="flex flex-col gap-6 border-b border-border py-12 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md">
            <h3 className="text-xl font-semibold">Clinic insights, straight to your inbox</h3>
            <p className="mt-2 text-sm text-foreground/60">Practical tips on growing your practice and product news. No spam.</p>
          </div>
          {done ? (
            <p className="text-sm font-medium text-primary">Thanks — you're on the list.</p>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); if (email) setDone(true); }}
              className="flex w-full max-w-md gap-2"
            >
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="h-11 flex-1 rounded-md border border-border bg-background px-4 text-sm outline-none focus:border-primary"
              />
              <button type="submit" className="inline-flex h-11 items-center gap-1.5 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90">
                Subscribe <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>

        <div className="grid gap-10 py-14 lg:grid-cols-6">
          <div className="space-y-4 lg:col-span-2">
            <img src={clinexusLogoWhite} alt="Clinexus" className="h-9" />
            <p className="max-w-xs text-sm text-foreground/60">
              Run a calmer, more profitable clinic, less admin, fewer no-shows, more time for patients.
            </p>
            <div className="space-y-1 text-sm text-foreground/60">
              <a href="mailto:support@clinexus.com.ng" className="block hover:text-foreground">support@clinexus.com.ng</a>
              <a href="https://wa.me/2349017758165" target="_blank" rel="noopener noreferrer" className="block hover:text-foreground">0901 7758 165</a>
              <span className="block">Ikeja, Lagos, Nigeria</span>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <a href="https://instagram.com/clinexus_ng" target="_blank" rel="noopener noreferrer" className="text-foreground/50 transition-colors hover:text-foreground" aria-label="Instagram">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://x.com/clinexus_ng" target="_blank" rel="noopener noreferrer" className="text-foreground/50 transition-colors hover:text-foreground" aria-label="X (Twitter)">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:col-span-4 lg:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title} className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.to}>
                    {l.to === "/login" ? (
                      <a href={l.to} className="text-sm text-foreground/60 transition-colors hover:text-foreground">{l.label}</a>
                    ) : (
                      <Link to={l.to} className="text-sm text-foreground/60 transition-colors hover:text-foreground">{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border py-6 text-xs text-foreground/50 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} Clinexus. All rights reserved.</span>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Nigeria (English)</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Secure cloud hosting</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
