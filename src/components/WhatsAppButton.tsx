import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

const WHATSAPP_NUMBER = "5511930617116";

const WhatsAppButton = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) return;

    const text = encodeURIComponent(
      `Olá! Meu nome é ${name.trim()}.\nTelefone: ${phone.trim()}\n\n${message.trim()}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank");
    setOpen(false);
    setName("");
    setPhone("");
    setMessage("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Popup */}
      {open && (
        <div className="absolute bottom-16 right-0 w-80 bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-primary p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary-foreground">
              <MessageCircle size={20} />
              <span className="font-semibold text-sm">Fale conosco</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-primary-foreground/80 hover:text-primary-foreground">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Nome</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                required
                maxLength={100}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Telefone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                required
                maxLength={20}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Mensagem</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Como podemos ajudar?"
                required
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#25D366] hover:bg-[#1da851] text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Send size={16} />
              Enviar pelo WhatsApp
            </button>
          </form>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1da851] text-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
        aria-label="WhatsApp"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
};

export default WhatsAppButton;
