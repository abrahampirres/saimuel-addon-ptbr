import { Button } from "@/components/ui/button";
import { ArrowUpRight, BadgeCheck, Check, Clipboard, ExternalLink, Film, Radio, ShieldCheck, Sparkles, Tv } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ProviderStatus = {
  id: string;
  name: string;
  credits: string;
  repository: string;
  languages: string[];
  status: "Ativo" | "Em validação";
  note: string;
  integrity: string;
};

type AddonStatus = {
  providers: ProviderStatus[];
  monitor: {
    status: "pending" | "healthy" | "degraded" | "down";
    label: string;
    checkedAt: string | null;
    totalChecks: number;
    failedChecks: number;
  };
  embedPlay: { status: string; note: string };
};

export default function Home() {
  const isPreview = useMemo(() => /(^localhost$)|(^127\.0\.0\.1$)|\.manus\.computer$/i.test(window.location.hostname), []);
  const manifestUrl = useMemo(() => isPreview ? null : `${window.location.origin}/manifest.json`, [isPreview]);
  const stremioInstallUrl = useMemo(() => manifestUrl ? `stremio://${manifestUrl.replace(/^https?:\/\//, "")}` : "#", [manifestUrl]);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<AddonStatus | null>(null);

  useEffect(() => {
    fetch("/api/addon/status")
      .then(response => (response.ok ? response.json() : Promise.reject(new Error("Diagnóstico indisponível"))))
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  async function copyManifest() {
    if (!manifestUrl) return;
    await navigator.clipboard.writeText(manifestUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#060a14] text-slate-100" data-preview-surface="addon-installation">
      <div className="pointer-events-none fixed inset-0 hero-grid opacity-60" />
      <div className="pointer-events-none fixed -left-32 top-16 h-96 w-96 rounded-full bg-emerald-400/10 blur-[120px]" />
      <div className="pointer-events-none fixed -right-28 bottom-0 h-96 w-96 rounded-full bg-cyan-400/10 blur-[120px]" />

      <main className="relative mx-auto max-w-6xl px-5 pb-16 pt-6 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-300/30 bg-emerald-300/10 text-emerald-300 shadow-[0_0_30px_rgba(110,231,183,0.15)]">
              <Radio size={19} />
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-tight">Saimuel Addon</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300">PT-BR Stream Bridge</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
            <ShieldCheck size={15} className="text-emerald-300" />
            Manifesto público · v2.0
          </div>
        </nav>

        <section className="grid gap-10 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-emerald-200">
              <Sparkles size={13} />
              streams em português, sem duplicidade
            </div>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.03] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
              Um caminho mais claro para encontrar <span className="text-emerald-300">streams PT-BR</span> no Stremio.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              Um addon público que transforma providers Nuvio elegíveis em respostas compatíveis com o Stremio, com origem, qualidade e estado de disponibilidade visíveis.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {manifestUrl ? <Button asChild className="h-11 bg-emerald-300 px-5 font-bold text-slate-950 hover:bg-emerald-200">
                <a href={stremioInstallUrl}>
                  Instalar no Stremio <ExternalLink size={16} />
                </a>
              </Button> : <Button disabled className="h-11 bg-slate-700 px-5 font-bold text-slate-300">Publique para instalar</Button>}
              <Button variant="outline" disabled={!manifestUrl} onClick={copyManifest} className="h-11 border-white/15 bg-white/[0.03] px-5 text-white hover:bg-white/10 hover:text-white">
                {copied ? <Check size={16} className="text-emerald-300" /> : <Clipboard size={16} />}
                {copied ? "URL copiada" : "Copiar manifesto"}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="rounded-xl border border-white/10 bg-[#080e1d] p-5">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-white"><BadgeCheck size={17} className="text-emerald-300" /> Instalação direta</div>
                <span className="rounded-full bg-emerald-300/10 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-emerald-300">Público</span>
              </div>
              <p className="mb-2 text-xs text-slate-400">URL do manifesto</p>
              <code className="block break-all rounded-lg border border-white/10 bg-black/25 p-3 font-mono text-xs leading-5 text-emerald-200">{manifestUrl ?? "Publique e defina um subdomínio fixo em manus.space"}</code>
              {isPreview && <p className="mt-3 text-xs leading-5 text-amber-200">Esta é uma prévia temporária. Ela não pode ser usada para instalar o addon no Stremio.</p>}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3"><Film size={18} className="mb-2 text-cyan-300" /><p className="text-sm font-bold">Filmes</p><p className="mt-1 text-xs text-slate-500">IDs IMDb → TMDB</p></div>
                <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3"><Tv size={18} className="mb-2 text-violet-300" /><p className="text-sm font-bold">Séries</p><p className="mt-1 text-xs text-slate-500">Temporada e episódio</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.5fr_0.85fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div><p className="font-mono text-[11px] uppercase tracking-[0.14em] text-emerald-300">Diagnóstico de fontes</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight">Providers elegíveis</h2></div>
              <p className="text-xs text-slate-500">Integridade verificada antes da execução</p>
            </div>
            <div className="divide-y divide-white/10">
              {(status?.providers ?? []).map(provider => (
                <div className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center" key={provider.id}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><p className="font-bold text-white">{provider.name}</p><span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${provider.status === "Ativo" ? "bg-emerald-300/10 text-emerald-300" : "bg-amber-300/10 text-amber-200"}`}>{provider.status}</span></div>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{provider.note}</p>
                  </div>
                  <a className="text-left font-mono text-[11px] text-slate-500 transition-colors hover:text-emerald-300 sm:text-right" href={provider.repository} target="_blank" rel="noreferrer">{provider.credits} ↗<br />{provider.integrity}</a>
                </div>
              ))}
              {!status && <p className="py-5 text-sm text-slate-500">Carregando o diagnóstico das fontes…</p>}
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.045] p-5 sm:p-7">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-300/10 blur-3xl" />
            <div className="relative">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-emerald-300">Guia rápido</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white">Instale em menos de um minuto.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Use o botão principal no topo. O Stremio reconhecerá o manifesto automaticamente.</p>

              <ol className="mt-6 space-y-3">
                <li className="flex gap-3 rounded-xl border border-white/10 bg-black/20 p-3.5">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-300 font-mono text-xs font-extrabold text-slate-950">1</span>
                  <div><p className="text-sm font-bold text-white">Toque em “Instalar no Stremio”</p><p className="mt-1 text-xs leading-5 text-slate-400">Abra o botão verde no topo desta página.</p></div>
                </li>
                <li className="flex gap-3 rounded-xl border border-white/10 bg-black/20 p-3.5">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-emerald-300/40 font-mono text-xs font-extrabold text-emerald-300">2</span>
                  <div><p className="text-sm font-bold text-white">Confirme no aplicativo</p><p className="mt-1 text-xs leading-5 text-slate-400">O Stremio abrirá uma tela para adicionar o addon.</p></div>
                </li>
                <li className="flex gap-3 rounded-xl border border-white/10 bg-black/20 p-3.5">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-emerald-300/40 font-mono text-xs font-extrabold text-emerald-300">3</span>
                  <div><p className="text-sm font-bold text-white">Escolha um filme ou série</p><p className="mt-1 text-xs leading-5 text-slate-400">As opções PT-BR aparecerão na área de streams do título.</p></div>
                </li>
              </ol>

              <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-slate-400">
                <ArrowUpRight size={15} className="shrink-0 text-emerald-300" />
                <span>Se o app não abrir, copie o manifesto acima e adicione-o manualmente no Stremio.</span>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
