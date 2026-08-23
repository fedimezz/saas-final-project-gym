import Link from "next/link";
import { MapPin, Phone, Mail, Dumbbell, Globe, Sparkles } from "lucide-react";
import { FaFacebookF, FaInstagram } from "react-icons/fa6";

export default function Footer() {
  return (
    <footer className="relative bg-[#05080f] text-slate-200 border-t border-slate-800/80 transition-colors duration-500 overflow-hidden">
      {/* Subtle top glow line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

      <div className="container mx-auto px-4 md:px-6 py-20 relative z-10 max-w-6xl">
        <div className="grid gap-12 md:grid-cols-4">
          
          {/* Brand Col */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                <Dumbbell className="h-5 w-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                Le Club <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              </span>
            </Link>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Complex Sportif &amp; Wellness d&apos;Élite à Gammarth. Musculation, Padel, Fitness et Coaching sur-mesure.
            </p>
          </div>

          {/* Nav Col */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 mb-5">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-400">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition-colors">Accueil</Link>
              </li>
              <li>
                <Link href="/activites" className="hover:text-emerald-400 transition-colors">Activités & Sports</Link>
              </li>
              <li>
                <Link href="/coaching" className="hover:text-emerald-400 transition-colors">Coaching Élite</Link>
              </li>
              <li>
                <Link href="/offres" className="hover:text-emerald-400 transition-colors">Formules & Tarifs</Link>
              </li>
              <li>
                <Link href="/actualites" className="hover:text-emerald-400 transition-colors">Actualités du Club</Link>
              </li>
            </ul>
          </div>

          {/* Contact Col */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 mb-5">
              Contact & Accès
            </h4>
            <ul className="space-y-3 text-xs font-medium text-slate-400">
              <li className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>Zone Touristique, Gammarth, Tunis</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>+216 71 000 000</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>contact@leclub-gammarth.tn</span>
              </li>
            </ul>
          </div>

          {/* Socials Col */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 mb-5">
              Réseaux Officiels
            </h4>
            <p className="text-xs text-slate-400 font-medium mb-4">
              Rejoignez notre communauté sur les réseaux sociaux.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                aria-label="Facebook"
                className="h-10 w-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition duration-300"
              >
                <FaFacebookF className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="h-10 w-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition duration-300"
              >
                <FaInstagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Website"
                className="h-10 w-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition duration-300"
              >
                <Globe className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-900 text-center text-xs font-medium text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Le Club Gammarth. Tous droits réservés.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Conditions d&apos;utilisation</span>
            <span className="hover:text-slate-400 cursor-pointer">Politique de confidentialité</span>
          </div>
        </div>
      </div>
    </footer>
  );
}