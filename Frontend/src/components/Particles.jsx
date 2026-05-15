import { useMemo } from "react";

export default function Particles(){

  const particles = useMemo(
    () => Array.from({length:25}, () => ({
      top: Math.random() * 100 + "%",
      left: Math.random() * 100 + "%"
    })),
    []
  )

  return (

    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {particles.map((pos, i)=>(
        <span
          key={i}
          className="absolute w-1 h-1 bg-sky-400 rounded-full opacity-60 animate-pulse"
          style={{ top: pos.top, left: pos.left }}
        />
      ))}

    </div>

  )

}