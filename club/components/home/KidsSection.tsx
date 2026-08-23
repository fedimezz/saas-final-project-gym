"use client"

import { motion } from "framer-motion"
import { Baby, School, Heart, Smile } from "lucide-react"
import Link from "next/link"

export default function KidsSection() {
  return (
    <section className="py-20 bg-gradient-to-r from-green-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <Baby className="h-10 w-10 text-green-600" />
              <h2 className="text-4xl font-bold text-gray-900">Kids & Séniors</h2>
            </div>
            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
              Parce que le sport n&apos;a pas d&apos;âge, nous proposons des cours spécialement adaptés 
              pour les enfants et les séniors.
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                  <Heart className="h-3 w-3 text-green-600" />
                </div>
                <p className="text-gray-600">Cours ludiques pour les 4-12 ans</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                  <School className="h-3 w-3 text-green-600" />
                </div>
                <p className="text-gray-600">Programmes adaptés pour les ados</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                  <Smile className="h-3 w-3 text-green-600" />
                </div>
                <p className="text-gray-600">Activités douces pour les séniors</p>
              </div>
            </div>
            <Link href="/kids-seniors">
              <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition">
                Découvrir nos programmes
              </button>
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-3xl p-8 text-white">
              <div className="text-center">
                <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
                <h3 className="text-2xl font-bold mb-2">Cours pour enfants</h3>
                <p className="mb-4">Initiation au sport dans la bonne humeur</p>
                <div className="text-4xl font-bold">-20%</div>
                <p className="text-sm opacity-90">sur l&apos;abonnement famille</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}