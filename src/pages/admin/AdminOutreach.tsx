import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Mail, Plus, Send, Pause, Play, Trash2, Copy, Eye, ShieldBan, Monitor, Smartphone, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { compileEmail } from "@/lib/outreachCompiler";
import { launchOutreachCampaign, pauseOutreachCampaign, resumeOutreachCampaign, sendOutreachTest } from "@/lib/outreach.functions";

type Campaign = {
  id: string; name: string; subject: string; preview_text: string | null; from_name: string; from_email: string;
  reply_to: string | null; html_content: string; plain_text: string | null; track_opens: boolean; track_clicks: boolean;
  status: string; total_recipients: number; sent_count: number; delivered_count: number; unique_opened_count: number;
  unique_clicked_count: number; bounced_count: number; unsubscribed_count: number; failed_count: number; created_at: string;
};

const db = supabase as any;
const token = async () => (await supabase.auth.getSession()).data.session?.access_token ?? "";
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const MERGE_TAGS = ["{{first_name}}", "{{name}}", "{{clinic_name|there}}", "{{city}}", "{{email}}", "{{unsubscribe_url}}"];
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline", sending: "default", paused: "secondary", completed: "secondary", failed: "destructive",
};
const DEFAULT_HTML = `<p>Hi {{first_name|there}},</p>
<p>I'm reaching out because {{clinic_name|your clinic}} could save hours every week with Clinexus.</p>
<p><a href="https://clinexus.com.ng">See how it works</a></p>
<p>Best,<br/>The Clinexus Team</p>
<p style="font-size:12px;color:#888">Clinexus, Lagos, Nigeria · <a href="{{unsubscribe_url}}">Unsubscribe</a></p>`;

function blank(): Partial<Campaign> {
  return {
    name: "", subject: "", preview_text: "", from_name: "Clinexus", from_email: "outreach@app.clinexus.com.ng",
    reply_to: "", html_content: DEFAULT_HTML, plain_text: "", track_opens: true, track_clicks: true,
  };
}

/** Parses CSV or pasted lines. First row with "email" is treated as header. */
export function parseAudience(raw: string) {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const split = (l: string) => l.split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ""));
  let header = split(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  let rows = lines.slice(1);
  if (!header.includes("email")) { header = ["email", "name", "clinic_name", "city"]; rows = lines; }
  return rows.map((l) => {
    const cells = split(l); const o: Record<string, string> = {};
    header.forEach((h, i) => { if (cells[i]) o[h] = cells[i]; });
    return o;
  }).filter((o) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.email ?? ""));
}

export default function AdminOutreach() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Campaign> | null>(null);
  const [selected, setSelected] = useState<string>("");

  const { data: campaigns = [] } = useQuery({
    queryKey: ["outreach-campaigns"],
    queryFn: async () => ((await db.from("outreach_campaigns").select("*").order("created_at", { ascending: false })).data ?? []) as Campaign[],
    refetchInterval: (q) => ((q.state.data as Campaign[] | undefined)?.some((c) => c.status === "sending") ? 4000 : false),
  });

  const totals = useMemo(() => {
    const t = campaigns.reduce((a, c) => ({
      sent: a.sent + c.sent_count, opened: a.opened + c.unique_opened_count, clicked: a.clicked + c.unique_clicked_count,
      bounced: a.bounced + c.bounced_count, unsub: a.unsub + c.unsubscribed_count,
    }), { sent: 0, opened: 0, clicked: 0, bounced: 0, unsub: 0 });
    return t;
  }, [campaigns]);

  const act = async (fn: (a: { data: { token: string; campaignId: string } }) => Promise<unknown>, id: string, msg: string) => {
    try { await fn({ data: { token: await token(), campaignId: id } }); toast({ title: msg }); qc.invalidateQueries({ queryKey: ["outreach-campaigns"] }); }
    catch (e) { toast({ title: "Could not do that", description: (e as Error).message, variant: "destructive" }); }
  };
  const remove = async (c: Campaign) => {
    if (!confirm(`Delete "${c.name}"? This removes its recipients and stats.`)) return;
    await db.from("outreach_recipients").delete().eq("campaign_id", c.id);
    await db.from("outreach_events").delete().eq("campaign_id", c.id);
    const { error } = await db.from("outreach_campaigns").delete().eq("id", c.id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    qc.invalidateQueries({ queryKey: ["outreach-campaigns"] });
  };
  const duplicate = (c: Campaign) => {
    const { id, status, created_at, ...rest } = c; void id; void status; void created_at;
    setEditing({ ...rest, name: `${c.name} (copy)` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Mail className="h-6 w-6 text-primary" /> Email Outreach</h1>
          <p className="text-sm text-muted-foreground">Campaigns send in the cloud — you can close this tab after launching.</p>
        </div>
        <Button onClick={() => setEditing(blank())}><Plus className="h-4 w-4 mr-1" /> New campaign</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          ["Emails sent", totals.sent.toLocaleString()],
          ["Open rate", `${pct(totals.opened, totals.sent)}%`],
          ["Click rate", `${pct(totals.clicked, totals.sent)}%`],
          ["Bounce rate", `${pct(totals.bounced, totals.sent)}%`],
          ["Unsubscribe rate", `${pct(totals.unsub, totals.sent)}%`],
        ].map(([l, v]) => (
          <Card key={l}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="text-2xl font-bold">{v}</p></CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList><TabsTrigger value="campaigns">Campaigns</TabsTrigger><TabsTrigger value="recipients">Recipients</TabsTrigger><TabsTrigger value="blocklist">Block list</TabsTrigger></TabsList>

        <TabsContent value="campaigns">
          <Card><CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Campaign</TableHead><TableHead>Status</TableHead><TableHead className="min-w-40">Progress</TableHead>
                <TableHead>Opens</TableHead><TableHead>Clicks</TableHead><TableHead>Bounced</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {campaigns.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No campaigns yet. Create your first one.</TableCell></TableRow>}
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground truncate max-w-56">{c.subject}</p></TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[c.status] ?? "outline"} className="capitalize">{c.status}</Badge></TableCell>
                    <TableCell>
                      <Progress value={pct(c.sent_count + c.failed_count, c.total_recipients)} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{c.sent_count} / {c.total_recipients} sent{c.failed_count ? ` · ${c.failed_count} skipped` : ""}</p>
                    </TableCell>
                    <TableCell>{c.unique_opened_count} <span className="text-xs text-muted-foreground">({pct(c.unique_opened_count, c.sent_count)}%)</span></TableCell>
                    <TableCell>{c.unique_clicked_count} <span className="text-xs text-muted-foreground">({pct(c.unique_clicked_count, c.sent_count)}%)</span></TableCell>
                    <TableCell>{c.bounced_count}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {(c.status === "draft" || c.status === "failed") && <Button size="sm" variant="ghost" onClick={() => setEditing(c)}>Edit</Button>}
                      {(c.status === "draft" || c.status === "failed") && <Button size="sm" onClick={() => act(launchOutreachCampaign, c.id, "Campaign launched — sending in the background")}><Send className="h-3.5 w-3.5 mr-1" />Launch</Button>}
                      {c.status === "sending" && <Button size="sm" variant="secondary" onClick={() => act(pauseOutreachCampaign, c.id, "Campaign paused")}><Pause className="h-3.5 w-3.5 mr-1" />Pause</Button>}
                      {c.status === "paused" && <Button size="sm" onClick={() => act(resumeOutreachCampaign, c.id, "Campaign resumed")}><Play className="h-3.5 w-3.5 mr-1" />Resume</Button>}
                      <Button size="icon" variant="ghost" title="View recipients" onClick={() => setSelected(c.id)}><Eye className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" title="Duplicate" onClick={() => duplicate(c)}><Copy className="h-4 w-4" /></Button>
                      {c.status !== "sending" && <Button size="icon" variant="ghost" title="Delete" onClick={() => remove(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="recipients"><RecipientsTab campaigns={campaigns} selected={selected} setSelected={setSelected} /></TabsContent>
        <TabsContent value="blocklist"><BlocklistTab /></TabsContent>
      </Tabs>

      {editing && <CampaignStudio initial={editing} onClose={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["outreach-campaigns"] }); }} />}
      {selected && <RecipientsDialog campaignId={selected} onClose={() => setSelected("")} />}
    </div>
  );
}

function CampaignStudio({ initial, onClose }: { initial: Partial<Campaign>; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [c, setC] = useState<Partial<Campaign>>(initial);
  const [audienceRaw, setAudienceRaw] = useState("");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [testEmail, setTestEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedId, setSavedId] = useState<string | undefined>(initial.id);
  const htmlRef = useRef<HTMLTextAreaElement>(null);
  const set = (k: keyof Campaign, v: unknown) => setC((p) => ({ ...p, [k]: v }));

  const { data: existingCount = 0 } = useQuery({
    queryKey: ["outreach-rcount", savedId],
    enabled: !!savedId,
    queryFn: async () => (await db.from("outreach_recipients").select("id", { count: "exact", head: true }).eq("campaign_id", savedId)).count ?? 0,
  });
  const parsed = useMemo(() => parseAudience(audienceRaw), [audienceRaw]);
  const unique = useMemo(() => {
    const m = new Map<string, Record<string, string>>();
    for (const r of parsed) m.set(r.email.toLowerCase(), r);
    return [...m.values()];
  }, [parsed]);
  const { data: suppressed = new Set<string>() } = useQuery({
    queryKey: ["outreach-supp-check", unique.map((u) => u.email).join(",")],
    enabled: unique.length > 0,
    queryFn: async () => {
      const set = new Set<string>();
      const emails = unique.map((u) => u.email.toLowerCase());
      for (let i = 0; i < emails.length; i += 200) {
        const { data } = await db.from("outreach_suppressions").select("email").in("email", emails.slice(i, i + 200));
        for (const r of data ?? []) set.add(String(r.email).toLowerCase());
      }
      return set;
    },
  });
  const sendable = unique.filter((u) => !suppressed.has(u.email.toLowerCase()));

  const preview = useMemo(() => compileEmail({
    html: c.html_content ?? "", text: c.plain_text ?? null, subject: c.subject ?? "", token: "preview",
    trackOpens: false, trackClicks: false,
    vars: { first_name: "Ada", name: "Ada Obi", clinic_name: "Bright Smile Dental", city: "Lagos", email: "ada@example.com" },
  }), [c.html_content, c.plain_text, c.subject]);

  const checks = [
    { ok: /\{\{\s*unsubscribe_url\s*\}\}/.test(c.html_content ?? ""), label: "Unsubscribe link ({{unsubscribe_url}}) in the email" },
    { ok: /lagos|nigeria|address|street|road/i.test(c.html_content ?? ""), label: "Postal address in the footer" },
    { ok: !!c.subject?.trim(), label: "Subject line set" },
    { ok: /@/.test(c.from_email ?? ""), label: `Sending from ${c.from_email} (domain must be verified in Resend)` },
    { ok: existingCount + sendable.length > 0, label: `${existingCount + sendable.length} recipient(s) ready` },
  ];

  const insertTag = (tag: string) => {
    const el = htmlRef.current; const v = c.html_content ?? "";
    const s = el?.selectionStart ?? v.length; const e = el?.selectionEnd ?? v.length;
    set("html_content", v.slice(0, s) + tag + v.slice(e));
    setTimeout(() => { el?.focus(); el?.setSelectionRange(s + tag.length, s + tag.length); });
  };

  const save = async (): Promise<string | null> => {
    if (!c.name?.trim()) { toast({ title: "Give the campaign a name", variant: "destructive" }); setStep(0); return null; }
    setBusy(true);
    try {
      const payload = {
        name: c.name, subject: c.subject ?? "", preview_text: c.preview_text || null, from_name: c.from_name ?? "Clinexus",
        from_email: c.from_email ?? "", reply_to: c.reply_to || null, html_content: c.html_content ?? "",
        plain_text: c.plain_text || null, track_opens: !!c.track_opens, track_clicks: !!c.track_clicks,
      };
      let id = savedId;
      if (id) {
        const { error } = await db.from("outreach_campaigns").update(payload).eq("id", id); if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { data, error } = await db.from("outreach_campaigns").insert({ ...payload, status: "draft", created_by: u.user?.id }).select("id").single();
        if (error) throw error; id = data.id as string; setSavedId(id);
      }
      if (sendable.length) {
        const known = core(c);
        const rows = sendable.map((r) => {
          const { email, name, first_name, clinic_name, ...meta } = r;
          return { campaign_id: id, recipient_email: email.toLowerCase(), recipient_name: name || first_name || null, clinic_name: clinic_name || null, metadata: meta, status: "pending" };
        });
        void known;
        for (let i = 0; i < rows.length; i += 500) {
          const { error } = await db.from("outreach_recipients").insert(rows.slice(i, i + 500)); if (error) throw error;
        }
        await db.from("outreach_campaigns").update({ total_recipients: existingCount + rows.length }).eq("id", id);
        setAudienceRaw("");
      }
      return id!;
    } catch (e) {
      toast({ title: "Could not save", description: (e as Error).message, variant: "destructive" }); return null;
    } finally { setBusy(false); }
  };

  const sendTest = async () => {
    const id = await save(); if (!id) return;
    setBusy(true);
    try { await sendOutreachTest({ data: { token: await token(), campaignId: id, testEmail } }); toast({ title: `Test sent to ${testEmail}` }); }
    catch (e) { toast({ title: "Test failed", description: (e as Error).message, variant: "destructive" }); }
    finally { setBusy(false); }
  };
  const launch = async () => {
    const id = await save(); if (!id) return;
    setBusy(true);
    try {
      const r = await launchOutreachCampaign({ data: { token: await token(), campaignId: id } });
      toast({ title: `Launched to ${r.total} recipients`, description: "Sending in the cloud — you can close this tab." }); onClose();
    } catch (e) { toast({ title: "Could not launch", description: (e as Error).message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const steps = ["Sender", "Audience", "Content", "Review & send"];
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{savedId ? "Edit campaign" : "New campaign"}</DialogTitle></DialogHeader>
        <div className="flex gap-2 flex-wrap">
          {steps.map((s, i) => <Button key={s} size="sm" variant={i === step ? "default" : "outline"} onClick={() => setStep(i)}>{i + 1}. {s}</Button>)}
        </div>

        {step === 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><Label>Campaign name (internal)</Label><Input value={c.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="Lagos dental clinics — Nov" /></div>
            <div><Label>Subject line</Label><Input value={c.subject ?? ""} onChange={(e) => set("subject", e.target.value)} placeholder="Quick question about {{clinic_name}}" /></div>
            <div><Label>Preview text</Label><Input value={c.preview_text ?? ""} onChange={(e) => set("preview_text", e.target.value)} placeholder="Shown next to the subject in the inbox" /></div>
            <div><Label>Sender name</Label><Input value={c.from_name ?? ""} onChange={(e) => set("from_name", e.target.value)} /></div>
            <div><Label>From email</Label><Input value={c.from_email ?? ""} onChange={(e) => set("from_email", e.target.value)} /></div>
            <div><Label>Reply-to email</Label><Input value={c.reply_to ?? ""} onChange={(e) => set("reply_to", e.target.value)} placeholder="sales@clinexus.com.ng" /></div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Paste a CSV with a header row (email, name, clinic_name, city…) or one email per line. Extra columns become merge tags.</p>
            <Input type="file" accept=".csv,text/csv,text/plain" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setAudienceRaw(await f.text()); }} />
            <Textarea rows={8} value={audienceRaw} onChange={(e) => setAudienceRaw(e.target.value)} placeholder={"email,name,clinic_name,city\nada@clinic.ng,Ada Obi,Bright Smile Dental,Lagos"} className="font-mono text-xs" />
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline">Already added: {existingCount}</Badge>
              <Badge variant="outline">Valid rows: {parsed.length}</Badge>
              <Badge variant="outline">Duplicates removed: {parsed.length - unique.length}</Badge>
              <Badge variant="destructive">Blocked & excluded: {unique.length - sendable.length}</Badge>
              <Badge>Will be added: {sendable.length}</Badge>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">{MERGE_TAGS.map((t) => <Button key={t} size="sm" variant="outline" className="font-mono text-xs h-7" onClick={() => insertTag(t)}>{t}</Button>)}</div>
            <div className="grid md:grid-cols-2 gap-3">
              <Textarea ref={htmlRef} rows={18} value={c.html_content ?? ""} onChange={(e) => set("html_content", e.target.value)} className="font-mono text-xs" />
              <iframe title="Preview" sandbox="" srcDoc={preview.html} className="w-full h-[430px] rounded-md border bg-card" />
            </div>
            <div><Label>Plain-text version (optional)</Label><Textarea rows={3} value={c.plain_text ?? ""} onChange={(e) => set("plain_text", e.target.value)} /></div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm"><Switch checked={!!c.track_opens} onCheckedChange={(v) => set("track_opens", v)} />Track opens</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={!!c.track_clicks} onCheckedChange={(v) => set("track_clicks", v)} />Track clicks</label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-semibold">Checklist</h3>
              {checks.map((k) => (
                <p key={k.label} className="flex items-start gap-2 text-sm">
                  {k.ok ? <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /> : <XCircle className="h-4 w-4 text-destructive mt-0.5" />}{k.label}
                </p>
              ))}
              <div className="pt-3 space-y-2">
                <Label>Send a test to</Label>
                <div className="flex gap-2"><Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="you@clinexus.com.ng" />
                  <Button variant="outline" disabled={busy || !testEmail} onClick={sendTest}>Send test</Button></div>
              </div>
            </div>
            <div>
              <div className="flex gap-1 mb-2">
                <Button size="sm" variant={device === "desktop" ? "default" : "outline"} onClick={() => setDevice("desktop")}><Monitor className="h-4 w-4" /></Button>
                <Button size="sm" variant={device === "mobile" ? "default" : "outline"} onClick={() => setDevice("mobile")}><Smartphone className="h-4 w-4" /></Button>
              </div>
              <div className="rounded-md border p-2 bg-muted">
                <p className="text-xs"><b>{c.from_name}</b> · {preview.subject}</p>
                <p className="text-xs text-muted-foreground mb-2">{c.preview_text}</p>
                <iframe title="Inbox preview" sandbox="" srcDoc={preview.html} className={`h-[360px] mx-auto block rounded bg-card ${device === "mobile" ? "w-[340px]" : "w-full"}`} />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-2 border-t">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <div className="flex gap-2">
            <Button variant="outline" disabled={busy} onClick={async () => { if (await save()) toast({ title: "Draft saved" }); }}>Save draft</Button>
            {step < 3 ? <Button onClick={() => setStep(step + 1)}>Next</Button>
              : <Button disabled={busy || checks.some((k) => !k.ok)} onClick={launch}><Send className="h-4 w-4 mr-1" />Launch campaign</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function core(c: Partial<Campaign>) { return c.id; }

const R_STATUSES = ["all", "pending", "sent", "delivered", "opened", "clicked", "bounced", "complained", "unsubscribed", "failed"];

function RecipientsTab({ campaigns, selected, setSelected }: { campaigns: Campaign[]; selected: string; setSelected: (s: string) => void }) {
  return (
    <Card><CardContent className="p-6 space-y-3">
      <p className="text-sm text-muted-foreground">Choose a campaign to inspect each recipient and their activity timeline.</p>
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="max-w-md"><SelectValue placeholder="Select a campaign" /></SelectTrigger>
        <SelectContent>{campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
      </Select>
    </CardContent></Card>
  );
}

function RecipientsDialog({ campaignId, onClose }: { campaignId: string; onClose: () => void }) {
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const { data: rows = [] } = useQuery({
    queryKey: ["outreach-recipients", campaignId, status],
    refetchInterval: 5000,
    queryFn: async () => {
      let q = db.from("outreach_recipients").select("*").eq("campaign_id", campaignId).order("created_at").limit(1000);
      if (status !== "all") q = q.eq("status", status);
      return ((await q).data ?? []) as any[];
    },
  });
  const { data: events = [] } = useQuery({
    queryKey: ["outreach-events", open],
    enabled: !!open,
    queryFn: async () => ((await db.from("outreach_events").select("*").eq("recipient_id", open).order("created_at")).data ?? []) as any[],
  });
  const list = rows.filter((r) => !search || r.recipient_email.includes(search.toLowerCase()));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Recipients</DialogTitle></DialogHeader>
        <div className="flex flex-wrap gap-1.5">{R_STATUSES.map((s) => <Button key={s} size="sm" variant={s === status ? "default" : "outline"} className="capitalize h-7" onClick={() => setStatus(s)}>{s}</Button>)}</div>
        <Input placeholder="Search email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Table>
          <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Status</TableHead><TableHead>Opens</TableHead><TableHead>Clicks</TableHead><TableHead>Sent</TableHead></TableRow></TableHeader>
          <TableBody>
            {list.map((r) => (
              <>
                <TableRow key={r.id} className="cursor-pointer" onClick={() => setOpen(open === r.id ? null : r.id)}>
                  <TableCell><p className="font-medium">{r.recipient_email}</p><p className="text-xs text-muted-foreground">{r.recipient_name} {r.clinic_name ? `· ${r.clinic_name}` : ""}</p>{r.error_message && <p className="text-xs text-destructive">{r.error_message}</p>}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{r.status}</Badge></TableCell>
                  <TableCell>{r.open_count}</TableCell><TableCell>{r.click_count}</TableCell>
                  <TableCell className="text-xs">{r.sent_at ? format(new Date(r.sent_at), "MMM d, HH:mm") : "—"}</TableCell>
                </TableRow>
                {open === r.id && (
                  <TableRow key={`${r.id}-ev`}><TableCell colSpan={5} className="bg-muted/50">
                    {events.length === 0 ? <p className="text-xs text-muted-foreground">No activity yet.</p> : events.map((e) => (
                      <p key={e.id} className="text-xs"><b className="capitalize">{e.event_type}</b> · {format(new Date(e.created_at), "MMM d, HH:mm:ss")} {e.url ? `· ${e.url}` : ""}</p>
                    ))}
                  </TableCell></TableRow>
                )}
              </>
            ))}
            {list.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No recipients here.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}

function BlocklistTab() {
  const qc = useQueryClient();
  const [reason, setReason] = useState("all");
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState("");
  const { data: rows = [] } = useQuery({
    queryKey: ["outreach-suppressions", reason],
    queryFn: async () => {
      let q = db.from("outreach_suppressions").select("*").order("created_at", { ascending: false }).limit(1000);
      if (reason !== "all") q = q.eq("reason", reason);
      return ((await q).data ?? []) as any[];
    },
  });
  const add = async () => {
    const e = email.trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await db.from("outreach_suppressions").insert({ email: e, reason: "manual", created_by: u.user?.id });
    if (error) toast({ title: "Could not block", description: error.message, variant: "destructive" });
    setEmail(""); qc.invalidateQueries({ queryKey: ["outreach-suppressions"] });
  };
  const unblock = async (id: string) => {
    await db.from("outreach_suppressions").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["outreach-suppressions"] });
  };
  const list = rows.filter((r) => !search || r.email.includes(search.toLowerCase()));
  return (
    <Card><CardContent className="p-6 space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input className="max-w-xs" placeholder="Block an email…" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button onClick={add}><ShieldBan className="h-4 w-4 mr-1" />Block</Button>
        <div className="flex-1" />
        <Input className="max-w-xs" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{["all", "unsubscribed", "bounced", "complained", "manual"].map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Reason</TableHead><TableHead>Added</TableHead><TableHead /></TableRow></TableHeader>
        <TableBody>
          {list.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.email}</TableCell><TableCell><Badge variant="outline" className="capitalize">{r.reason}</Badge></TableCell>
              <TableCell className="text-xs">{format(new Date(r.created_at), "MMM d, yyyy")}</TableCell>
              <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => unblock(r.id)}>Unblock</Button></TableCell>
            </TableRow>
          ))}
          {list.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Block list is empty.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </CardContent></Card>
  );
}
