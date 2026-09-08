'use client';

import { ArrowRightIcon, StarIcon } from "@phosphor-icons/react";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      <header className="w-full p-4 sticky top-0">
        <div className="flex items-center justify-between max-w-250 mx-auto">
          <div>
            <b className="text-2xl">Cinesfera</b>
          </div>
          <div>
            <ul className="flex items-center gap-8 text-gray-400">
              <li><a href="#" className="text-white">Explorar</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Tendencias</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Comunidad</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Soporte</a></li>
              <li><a href="#" className="border px-4 py-2 rounded-2xl text-white border-gray-700">Acceder</a></li>
            </ul>
          </div>
        </div>
      </header>

      <div className="w-full min-h-[70dvh] grid items-center justify-center grid-rows-1 grid-cols-1">
        <div className="max-w-200 text-center flex flex-col gap-4 mx-auto">
          <h1 className="text-5xl font-bold text-balance">Descubre, puntúa y comparte tus películas y series favoritas</h1>
          <p className="text-gray-300">La comunidad definitiva para cinéfilos. Lleva un registro de todo lo que ves, lee reseñas sinceras de la comunidad y califica tus títulos preferidos.</p>

          <div className="pt-8 flex flex-col gap-4 justify-center items-center">
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-3xl flex items-center gap-2">
              Inicie sesión aquí <ArrowRightIcon weight="bold" />
            </button>
            <p className="text-gray-400">¿No tienes cuenta? <a href="" className="text-cyan-300 underline">regístrate aquí</a></p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-250 mx-auto flex flex-col gap-4 p-4">
        <div className="flex items-center gap-4 justify-center">
          <hr className="border-cyan-300 w-16" />
          <h2 className="text-center uppercase text-cyan-300">Joyas de la cartelera</h2>
          <hr className="border-cyan-300 w-16" />
        </div>
        <div className="flex items-center justify-center gap-14">

          <div className="w-75 h-114 -rotate-2 bg-gray-800 rounded-2xl outline-2 outline-cyan-300/50 relative overflow-hidden shadow-xl shadow-cyan-300/20 shadow-">
            <div className="absolute bottom-0 p-4 bg-linear-to-t from-black to-transparent w-full flex flex-col gap-2">
              <h3 className="font-semibold text-lg">Spider-Man: No Way Home</h3>
              <div className="flex items-center justify-between gap-4">
                <p className="flex items-center gap-2 text-cyan-300 font-semibold">
                  <StarIcon weight="bold"/>
                  4.3
                </p>
                <span className="px-4 py-1 border text-sm rounded border-gray-600 bg-gray-800 text-gray-400">Fantasia</span>
              </div>
            </div>
          </div>

          <div className="w-75 h-114 bg-gray-800 rounded-2xl outline-2 outline-cyan-300/50 relative overflow-hidden shadow-xl shadow-cyan-300/20 shadow-">
            <div className="absolute bottom-0 p-4 bg-linear-to-t from-black to-transparent w-full flex flex-col gap-2">
              <h3 className="font-semibold text-lg">Spider-Man: No Way Home</h3>
              <div className="flex items-center justify-between gap-4">
                <p className="flex items-center gap-2 text-cyan-300 font-semibold">
                  <StarIcon weight="bold"/>
                  4.3
                </p>
                <span className="px-4 py-1 border text-sm rounded border-gray-600 bg-gray-800 text-gray-400">Fantasia</span>
              </div>
            </div>
          </div>

          <div className="w-75 h-114 rotate-2 bg-gray-800 rounded-2xl outline-2 outline-cyan-300/50 relative overflow-hidden shadow-xl shadow-cyan-300/20 shadow-">
            <div className="absolute bottom-0 p-4 bg-linear-to-t from-black to-transparent w-full flex flex-col gap-2">
              <h3 className="font-semibold text-lg">Spider-Man: No Way Home</h3>
              <div className="flex items-center justify-between gap-4">
                <p className="flex items-center gap-2 text-cyan-300 font-semibold">
                  <StarIcon weight="bold"/>
                  4.3
                </p>
                <span className="px-4 py-1 border text-sm rounded border-gray-600 bg-gray-800 text-gray-400">Fantasia</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="w-full max-w-250 mx-auto flex flex-col gap-4 p-4 py-14">
        <div>
          <div>
            <h2 className="text-3xl font-bold">Tendencias de la Semana</h2>
            <p className="text-gray-300">Las producciones que están dando de qué hablar en la comunidad hoy.</p>
          </div>
          <a href="#">Ver todas las tendencias </a>
        </div>
      </div>

      <footer>

      </footer>
    </div>
  );
}
