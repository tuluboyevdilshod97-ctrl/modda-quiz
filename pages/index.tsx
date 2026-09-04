import { useState } from 'react'
import Quiz from '../components/Quiz'
import data from '../data/questions.json'

export default function Home(){
  const [categoryKey, setCategoryKey] = useState<string | null>(null)
  const categories = data.categories

  if(categoryKey){
    return <Quiz categoryKey={categoryKey} data={categories[categoryKey]} onExit={() => setCategoryKey(null)} />
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">MODDA — Huquq fanidan testlar</h1>
        <p className="text-gray-600 mt-2">Tanlang bo'lim va testni boshlang</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.keys(categories).map((k) => (
          <button key={k} onClick={() => setCategoryKey(k)} className="bg-white p-4 rounded-xl shadow hover:shadow-lg text-left">
            <h3 className="font-semibold text-lg">{categories[k].title}</h3>
            <p className="text-sm text-gray-500">{categories[k].desc}</p>
            <div className="mt-3 text-xs text-gray-400">{categories[k].questions.length} savol</div>
          </button>
        ))}
      </section>
    </main>
  )
}
