"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, Banknote, Bell, Camera, ChevronRight, CircleDollarSign, Clock3, Home, ImagePlus, Menu, Package, Plus, ReceiptText, Shirt, ShoppingBag, TrendingUp, UserRound, Users, WalletCards, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Payment = { id: number; customer: string; amount: number; date: string; status: "Vence hoy" | "Próximo" | "Atrasado"; initials: string };
type Sale = { id: number; customer: string; garment: string; photo: string; total: number; paid: number; date: string };
const currency = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default function HomePage() {
  const [saleOpen, setSaleOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<"inicio" | "ventas" | "abonos" | "clientes">("inicio");
  const [notice, setNotice] = useState("");
  const [payments, setPayments] = useState<Payment[]>(() => typeof window === "undefined" ? [] : JSON.parse(localStorage.getItem("ropa-payments") || "[]"));
  const [sales, setSales] = useState<Sale[]>(() => typeof window === "undefined" ? [] : JSON.parse(localStorage.getItem("ropa-sales") || "[]"));
  const [customer, setCustomer] = useState("");
  const [garmentName, setGarmentName] = useState("");
  const [garmentPhoto, setGarmentPhoto] = useState("");
  const [saleTotal, setSaleTotal] = useState("");
  const [initialPayment, setInitialPayment] = useState("");
  const [paymentCustomer, setPaymentCustomer] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const pendingTotal = useMemo(() => payments.reduce((sum, payment) => sum + payment.amount, 0), [payments]);
  const salesTotal = useMemo(() => sales.reduce((sum, sale) => sum + sale.total, 0), [sales]);
  const receivedTotal = useMemo(() => sales.reduce((sum, sale) => sum + sale.paid, 0), [sales]);
  const customers = useMemo(() => [...new Set(sales.map((sale) => sale.customer))], [sales]);

  function saveSale() {
    const total = Number(saleTotal.replace(/\D/g, ""));
    const paid = Number(initialPayment.replace(/\D/g, ""));
    if (!customer.trim() || !garmentName.trim() || !total) { setNotice("Completa el cliente, la prenda y el total de la venta."); return; }
    const balance = Math.max(total - paid, 0);
    const newSale = { id: Date.now(), customer: customer.trim(), garment: garmentName.trim(), photo: garmentPhoto, total, paid, date: new Date().toLocaleDateString("es-CO") };
    setSales((current) => [newSale, ...current]);
    if (balance > 0) setPayments((current) => [{ id: Date.now(), customer, amount: balance, date: "Sin fecha", status: "Próximo", initials: customer.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() }, ...current]);
    setNotice(`Venta registrada. Saldo pendiente: ${currency.format(balance)}.`);
    setSaleOpen(false); setCustomer(""); setGarmentName(""); setGarmentPhoto(""); setSaleTotal(""); setInitialPayment("");
  }

  function selectGarmentPhoto(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setGarmentPhoto(String(reader.result));
    reader.readAsDataURL(file);
  }

  function savePayment() {
    const amount = Number(paymentAmount.replace(/\D/g, ""));
    if (!amount) { setNotice("Escribe el valor del abono."); return; }
    setPayments((current) => current.map((item) => item.customer === paymentCustomer ? { ...item, amount: Math.max(item.amount - amount, 0) } : item).filter((item) => item.amount > 0));
    setNotice(`Abono de ${currency.format(amount)} registrado para ${paymentCustomer}.`);
    setPaymentAmount(""); setPaymentOpen(false);
  }

  useEffect(() => {
    localStorage.setItem("ropa-sales", JSON.stringify(sales));
    localStorage.setItem("ropa-payments", JSON.stringify(payments));
  }, [sales, payments]);

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool?: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({ name: "start_new_sale", title: "Iniciar nueva venta", description: "Abre el formulario visible para registrar una nueva venta de ropa.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: async () => { setSaleOpen(true); return { opened: true }; } }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-[#17212b]">
      <div className="mx-auto flex min-h-screen max-w-[1500px]">
        <aside className={`fixed inset-y-0 left-0 z-40 w-[248px] border-r border-slate-200 bg-white px-5 py-6 transition-transform lg:static lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="mb-9 flex items-center justify-between"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#5b43d6] text-white shadow-[0_8px_20px_rgba(91,67,214,.25)]"><Shirt size={23} /></div><div><p className="text-[1.06rem] font-extrabold tracking-tight">Control de Ropa</p><p className="text-xs text-slate-400">Tu negocio al día</p></div></div><button className="lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú"><X /></button></div>
          <nav className="space-y-1.5" aria-label="Navegación principal"><NavItem icon={<Home size={19} />} label="Inicio" active={activeView === "inicio"} onClick={() => setActiveView("inicio")} /><NavItem icon={<ReceiptText size={19} />} label="Ventas" active={activeView === "ventas"} onClick={() => setActiveView("ventas")} /><NavItem icon={<ArrowDownLeft size={19} />} label="Abonos" badge={payments.length ? String(payments.length) : undefined} active={activeView === "abonos"} onClick={() => setActiveView("abonos")} /><NavItem icon={<Users size={19} />} label="Clientes" active={activeView === "clientes"} onClick={() => setActiveView("clientes")} /><NavItem icon={<Package size={19} />} label="Prendas" /><NavItem icon={<WalletCards size={19} />} label="Dinero" /></nav>
          <div className="absolute bottom-6 left-5 right-5 rounded-2xl bg-[#f2efff] p-4"><p className="mb-1 text-sm font-bold text-[#4330af]">Cierre de septiembre</p><p className="mb-3 text-xs leading-relaxed text-[#6d62a8]">Tus cuentas están listas para revisar.</p><button className="text-sm font-bold text-[#5b43d6]">Ver resumen →</button></div>
        </aside>
        {menuOpen && <button className="fixed inset-0 z-30 bg-slate-950/25 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú" />}

        <main className="min-w-0 flex-1 px-4 pb-24 pt-4 sm:px-7 sm:pt-6 lg:px-10 lg:pb-10">
          <header className="mb-8 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><button className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Abrir menú"><Menu /></button><div><p className="text-sm text-slate-400">Martes, 15 de septiembre</p><h1 className="text-2xl font-extrabold tracking-tight sm:text-[1.75rem]">Buenos días 👋</h1></div></div><div className="flex items-center gap-2"><button className="relative grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white" aria-label="Notificaciones"><Bell size={19} /><span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#ef5b74] ring-2 ring-white" /></button><div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 sm:flex"><div className="grid h-8 w-8 place-items-center rounded-full bg-[#efeaff] text-xs font-bold text-[#5b43d6]">AD</div><div><p className="text-sm font-bold">Administrador</p><p className="text-[11px] text-slate-400">Cuenta principal</p></div></div></div></header>
          {notice && <div className="mb-5 flex items-center justify-between rounded-2xl border border-[#cfc7ff] bg-[#f2efff] px-4 py-3 text-sm font-medium text-[#4936b8]"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Cerrar aviso"><X size={17} /></button></div>}

          {activeView === "inicio" && <><section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><SummaryCard label="Ventas del mes" value={currency.format(salesTotal)} detail={`${sales.length} ventas registradas`} icon={<TrendingUp />} tone="purple" /><SummaryCard label="Dinero recibido" value={currency.format(receivedTotal)} detail="Pagos registrados" icon={<CircleDollarSign />} tone="green" /><SummaryCard label="Por cobrar" value={currency.format(pendingTotal)} detail={`${payments.length} clientes con saldo`} icon={<Clock3 />} tone="orange" /><SummaryCard label="Ganancia estimada" value={currency.format(0)} detail="Se calculará con los costos" icon={<Banknote />} tone="blue" /></section>

          <section className="mb-7 grid gap-4 md:grid-cols-2">
            <Dialog open={saleOpen} onOpenChange={setSaleOpen}><DialogTrigger render={<button className="group flex min-h-[136px] items-center gap-5 rounded-[24px] bg-[#5b43d6] p-6 text-left text-white shadow-[0_14px_30px_rgba(91,67,214,.22)] transition hover:-translate-y-0.5 hover:bg-[#4e38c6]" />}><span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15"><ShoppingBag size={30} /></span><span className="min-w-0 flex-1"><span className="block text-xl font-extrabold">Nueva venta</span><span className="mt-1 block text-sm text-white/75">Cliente, foto de la prenda y cuánto pagó</span></span><ChevronRight className="transition group-hover:translate-x-1" /></DialogTrigger><DialogContent className="max-h-[92vh] max-w-md overflow-y-auto rounded-[24px] p-0"><div className="bg-[#5b43d6] p-6 text-white"><DialogHeader><DialogTitle className="text-xl">Registrar nueva venta</DialogTitle><DialogDescription className="text-white/70">Guarda la foto para reconocer fácilmente qué se vendió.</DialogDescription></DialogHeader></div><div className="space-y-4 px-6 py-5"><Field label="Cliente"><Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Ej. María González" /></Field><Field label="Prenda vendida"><Input value={garmentName} onChange={(e) => setGarmentName(e.target.value)} placeholder="Ej. Vestido negro, talla M" /></Field><Field label="Foto de la prenda"><label className="block cursor-pointer"><input className="sr-only" type="file" accept="image/*" capture="environment" onChange={(e) => selectGarmentPhoto(e.target.files?.[0])} />{garmentPhoto ? <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"><img src={garmentPhoto} alt="Vista previa de la prenda" className="h-44 w-full object-cover" /><span className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-bold text-[#5b43d6] shadow"><Camera size={15} /> Cambiar foto</span></div> : <div className="grid min-h-32 place-items-center rounded-2xl border-2 border-dashed border-[#cfc7ff] bg-[#f7f5ff] p-5 text-center text-[#5b43d6]"><span><ImagePlus className="mx-auto mb-2" size={28} /><strong className="block text-sm">Tomar o elegir foto</strong><small className="mt-1 block text-xs font-medium text-[#776ab4]">Desde la cámara o la galería</small></span></div>}</label></Field><Field label="Total de la venta"><Input inputMode="numeric" value={saleTotal} onChange={(e) => setSaleTotal(e.target.value)} placeholder="$ 0" /></Field><Field label="¿Cuánto pagó hoy?"><Input inputMode="numeric" value={initialPayment} onChange={(e) => setInitialPayment(e.target.value)} placeholder="$ 0" /></Field>{saleTotal && <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm"><span className="text-slate-500">Saldo pendiente</span><strong className="float-right">{currency.format(Math.max(Number(saleTotal.replace(/\D/g, "")) - Number(initialPayment.replace(/\D/g, "")), 0))}</strong></div>}</div><DialogFooter className="border-t border-slate-100 px-6 py-4"><Button variant="outline" onClick={() => setSaleOpen(false)}>Cancelar</Button><Button className="bg-[#5b43d6] hover:bg-[#4e38c6]" onClick={saveSale}>Guardar venta</Button></DialogFooter></DialogContent></Dialog>
            <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}><DialogTrigger render={<button className="group flex min-h-[136px] items-center gap-5 rounded-[24px] border border-[#d9d2ff] bg-[#f1eeff] p-6 text-left text-[#3f2ba6] transition hover:-translate-y-0.5 hover:border-[#bcb0ff]" />}><span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white"><ArrowDownLeft size={30} /></span><span className="min-w-0 flex-1"><span className="block text-xl font-extrabold">Registrar abono</span><span className="mt-1 block text-sm text-[#7163b2]">Busca el cliente, escribe el valor y listo</span></span><ChevronRight className="transition group-hover:translate-x-1" /></DialogTrigger><DialogContent className="max-w-md rounded-[24px]"><DialogHeader><DialogTitle>Registrar abono</DialogTitle><DialogDescription>El saldo del cliente se actualizará automáticamente.</DialogDescription></DialogHeader><div className="space-y-4 py-3"><Field label="Cliente"><select className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={paymentCustomer} onChange={(e) => setPaymentCustomer(e.target.value)}>{payments.map((item) => <option key={item.id}>{item.customer}</option>)}</select></Field><Field label="Valor recibido"><Input inputMode="numeric" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="$ 0" /></Field></div><DialogFooter><Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancelar</Button><Button className="bg-[#5b43d6] hover:bg-[#4e38c6]" onClick={savePayment}>Confirmar abono</Button></DialogFooter></DialogContent></Dialog>
          </section></>}
          {activeView === "ventas" && <DataPanel title="Ventas" action="Nueva venta" onAction={() => { setActiveView("inicio"); setSaleOpen(true); }} empty="Aún no has registrado ventas.">{sales.map((sale) => <div key={sale.id} className="flex items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-0">{sale.photo ? <img src={sale.photo} alt={sale.garment} className="h-16 w-16 rounded-xl object-cover" /> : <div className="grid h-16 w-16 rounded-xl bg-slate-100 place-items-center"><Shirt className="text-slate-400" /></div>}<div className="min-w-0 flex-1"><p className="font-bold">{sale.garment}</p><p className="text-sm text-slate-500">{sale.customer} · {sale.date}</p></div><strong>{currency.format(sale.total)}</strong></div>)}</DataPanel>}
          {activeView === "abonos" && <DataPanel title="Abonos pendientes" empty="No hay abonos pendientes.">{payments.map((payment) => <PaymentRow key={payment.id} payment={payment} onPay={() => { setActiveView("inicio"); setPaymentCustomer(payment.customer); setPaymentOpen(true); }} />)}</DataPanel>}
          {activeView === "clientes" && <DataPanel title="Clientes" empty="Los clientes aparecerán al registrar la primera venta.">{customers.map((name) => <div key={name} className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-0"><div className="grid h-11 w-11 place-items-center rounded-full bg-[#f0edff] font-bold text-[#5b43d6]">{name.split(" ").map((part) => part[0]).join("").slice(0,2)}</div><strong>{name}</strong></div>)}</DataPanel>}

          <section className="grid gap-5 xl:grid-cols-[1.35fr_.85fr]">
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6"><div><h2 className="text-lg font-extrabold">Próximos cobros</h2><p className="mt-0.5 text-sm text-slate-400">Abonos que debes tener presentes</p></div><button className="text-sm font-bold text-[#5b43d6]">Ver todos</button></div><div className="divide-y divide-slate-100">{payments.slice(0, 4).map((payment) => <PaymentRow key={payment.id} payment={payment} onPay={() => { setPaymentCustomer(payment.customer); setPaymentOpen(true); }} />)}{!payments.length && <div className="px-6 py-12 text-center text-sm text-slate-400">No tienes cobros pendientes.</div>}</div></div>
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-extrabold">Tu dinero</h2><p className="mt-0.5 text-sm text-slate-400">Aunque esté en una sola cuenta</p></div><WalletCards className="text-[#5b43d6]" /></div><div className="mb-5 rounded-2xl bg-[#182334] p-5 text-white"><p className="text-xs text-white/55">Saldo registrado</p><p className="mt-1 text-2xl font-extrabold">$3.425.000</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[72%] rounded-full bg-[#8470ef]" /></div></div><MoneyRow color="#5b43d6" label="Capital para mercancía" value="$2.150.000" percent="63%" /><MoneyRow color="#26a982" label="Ganancia disponible" value="$825.000" percent="24%" /><MoneyRow color="#ef9e3e" label="Gastos e imprevistos" value="$450.000" percent="13%" /></div>
          </section>
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-slate-200 bg-white px-2 py-2 lg:hidden"><MobileNav icon={<Home />} label="Inicio" active={activeView === "inicio"} onClick={() => setActiveView("inicio")} /><MobileNav icon={<ReceiptText />} label="Ventas" active={activeView === "ventas"} onClick={() => setActiveView("ventas")} /><button onClick={() => setSaleOpen(true)} className="mx-auto -mt-7 grid h-14 w-14 place-items-center rounded-full bg-[#5b43d6] text-white shadow-lg" aria-label="Nueva venta"><Plus /></button><MobileNav icon={<ArrowDownLeft />} label="Abonos" active={activeView === "abonos"} onClick={() => setActiveView("abonos")} /><MobileNav icon={<UserRound />} label="Clientes" active={activeView === "clientes"} onClick={() => setActiveView("clientes")} /></nav>
    </div>
  );
}

function NavItem({ icon, label, badge, active = false, onClick }: { icon: React.ReactNode; label: string; badge?: string; active?: boolean; onClick?: () => void }) { return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${active ? "bg-[#eeeaff] text-[#5b43d6]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>{icon}<span className="flex-1 text-left">{label}</span>{badge && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-[#ef5b74] px-1 text-xs text-white">{badge}</span>}</button>; }
function MobileNav({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) { return <button onClick={onClick} className={`flex flex-col items-center gap-1 text-[11px] font-semibold ${active ? "text-[#5b43d6]" : "text-slate-400"}`}><span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>{label}</button>; }
function DataPanel({ title, action, onAction, empty, children }: { title: string; action?: string; onAction?: () => void; empty: string; children: React.ReactNode }) { const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children); return <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-5"><h2 className="text-xl font-extrabold">{title}</h2>{action && <Button onClick={onAction} className="bg-[#5b43d6] hover:bg-[#4e38c6]">{action}</Button>}</div>{hasItems ? children : <div className="px-6 py-16 text-center text-slate-400"><Package className="mx-auto mb-3" /><p>{empty}</p></div>}</section>; }
function SummaryCard({ label, value, detail, icon, tone }: { label: string; value: string; detail: string; icon: React.ReactNode; tone: string }) { return <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_4px_16px_rgba(31,41,55,.035)]"><div className={`summary-icon ${tone}`}>{icon}</div><p className="mt-4 text-sm font-medium text-slate-400">{label}</p><p className="mt-1 text-[1.45rem] font-extrabold tracking-tight">{value}</p><p className="mt-2 text-xs text-slate-400">{detail}</p></div>; }
function PaymentRow({ payment, onPay }: { payment: Payment; onPay: () => void }) { const statusClass = payment.status === "Atrasado" ? "bg-rose-50 text-rose-600" : payment.status === "Vence hoy" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"; return <div className="flex items-center gap-3 px-5 py-4 sm:px-6"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f0edff] text-sm font-bold text-[#5b43d6]">{payment.initials}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-bold">{payment.customer}</p><span className={`hidden rounded-full px-2 py-1 text-[10px] font-bold sm:inline ${statusClass}`}>{payment.status}</span></div><p className="mt-0.5 text-xs text-slate-400">{payment.date}</p></div><div className="text-right"><p className="text-sm font-extrabold">{currency.format(payment.amount)}</p><button onClick={onPay} className="mt-1 text-xs font-bold text-[#5b43d6]">Abonar</button></div></div>; }
function MoneyRow({ color, label, value, percent }: { color: string; label: string; value: string; percent: string }) { return <div className="flex items-center gap-3 border-b border-slate-100 py-3.5 last:border-0"><span className="h-3 w-3 rounded-full" style={{ background: color }} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{label}</p><p className="text-xs text-slate-400">{percent} del saldo</p></div><strong className="text-sm">{value}</strong></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>{children}</label>; }
