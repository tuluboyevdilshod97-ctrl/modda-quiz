import { useEffect, useState, useRef } from 'react'

export default function Quiz({ categoryKey, data, onExit }: any){
  const questions = data.questions
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState(Array(questions.length).fill(null))
  const [timeLeft, setTimeLeft] = useState(45)
  const timerRef = useRef<any>(null)

  useEffect(() => {
    resetTimer()
    return () => clearInterval(timerRef.current)
  }, [current])

  function resetTimer(){
    clearInterval(timerRef.current)
    setTimeLeft(45)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if(t <= 1){
          clearInterval(timerRef.current)
          handleNext(true)
          return 0
        }
        return t-1
      })
    }, 1000)
  }

  function selectOption(idx:number){
    const copy = [...answers]
    copy[current] = idx
    setAnswers(copy)
  }

  function handleNext(forced=false){
    if(!forced && answers[current] === null) return alert('Avvalo javobni tanlang')
    if(current < questions.length -1){
      setCurrent(c => c+1)
    } else {
      // show results
      const correct = questions.reduce((s:any,q:any,i:number) => s + (answers[i] === q.correct ? 1 : 0), 0)
      alert(`Natija: ${correct} / ${questions.length}`)
      onExit()
    }
  }

  const q = questions[current]

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold">{data.title}</h2>
          <p className="text-sm text-gray-500">{current+1} / {questions.length}</p>
        </div>
        <div className="text-sm text-gray-700">{timeLeft}s</div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <div className="text-lg font-semibold mb-4">{q.q}</div>
        <div className="space-y-3">
          {q.options.map((opt:any, i:number) => (
            <button key={i} onClick={() => selectOption(i)} className={`w-full text-left p-3 rounded-lg border ${answers[current]===i? 'border-accent1 bg-gradient-to-r from-accent1/10 to-accent2/10' : 'border-gray-200'}`}>
              <div className="font-medium">{String.fromCharCode(65+i)}) {opt}</div>
            </button>
          ))}
        </div>

        <div className="flex justify-between mt-6">
          <button onClick={() => { clearInterval(timerRef.current); onExit() }} className="px-4 py-2 rounded-lg border">Chiqish</button>
          <button onClick={() => handleNext(false)} className="px-4 py-2 rounded-lg bg-accent1 text-white">{current === questions.length-1? 'Yakunlash' : 'Keyingi'}</button>
        </div>
      </div>
    </div>
  )
}
