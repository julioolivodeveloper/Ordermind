import Link from "next/link";
import { MapPin, Phone, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">🌮</span>
              <div>
                <p className="font-bold text-lg leading-none">Acá Las Tortas</p>
                <p className="text-red-400 text-sm">El Paso, TX</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Auténtica comida mexicana hecha con amor. Tortas, tacos,
              hamburguesas y burritos para todos.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-bold mb-4 text-gray-100">Navegación</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link href="/menu" className="hover:text-white transition-colors">
                  Menú
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold mb-4 text-gray-100">Contacto</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 text-red-400 shrink-0" />
                <span>El Paso, TX 79901</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-red-400 shrink-0" />
                <span>(915) 555-0100</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock size={14} className="mt-0.5 text-red-400 shrink-0" />
                <span>Lun–Dom: 10:00 AM – 10:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Acá Las Tortas El Paso. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
