import React, { forwardRef, useRef } from "react"
import { Bot, FileSpreadsheet } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatedBeam } from "@/components/ui/animated-beam"
import LM from "../assets/icons/LM.png"
import RAC from "../assets/icons/RAC.png"
import EQ from "../assets/icons/eq.png"
import plena from "../assets/icons/plena.png"
import unidas from "../assets/icons/UNIDAS.png"
import bbts from "../assets/icons/BBTS.png"

const Circle = forwardRef<
  HTMLDivElement,
  { 
    className?: string
    children?: React.ReactNode
    size?: "sm" | "md" | "lg"
    variant?: "dark" | "light"
    isDisabled?: boolean
  }
>(({ className, children, size = "md", variant = "dark", isDisabled = false }, ref) => {
  const sizeClasses = {
    sm: "size-16",
    md: "size-20",
    lg: "size-24",
  }

  const variantClasses = {
    dark: "border-slate-700 bg-slate-800 hover:border-slate-600",
    light: "border-slate-300 bg-white hover:border-slate-400"
  }

  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex items-center justify-center rounded-full border-2 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110",
        sizeClasses[size],
        variantClasses[variant],
        isDisabled && "opacity-40 grayscale",
        className
      )}
    >
      <div className="flex items-center justify-center w-full h-full">
        {children}
      </div>
    </div>
  )
})

Circle.displayName = "Circle"

const LogoContainer = ({ src, alt }: { src: string; alt: string }) => {
  return (
    <div className="w-full h-full flex items-center justify-center p-1">
      <img
        src={src}
        alt={alt}
        className="w-4/5 h-4/5 object-contain object-center"
      />
    </div>
  )
}

export function AnimatedBeamMultipleOutputDemo({
  className,
  isActive = true, // Prop para controlar o estado
}: {
  className?: string
  isActive?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const div1Ref = useRef<HTMLDivElement>(null)
  const div2Ref = useRef<HTMLDivElement>(null)
  const div3Ref = useRef<HTMLDivElement>(null)
  const div4Ref = useRef<HTMLDivElement>(null)
  const div5Ref = useRef<HTMLDivElement>(null)
  const div6Ref = useRef<HTMLDivElement>(null)
  const div7Ref = useRef<HTMLDivElement>(null)

  return (
    <div
      className={cn(
        "relative flex h-[600px] w-full items-center justify-center overflow-hidden p-8 rounded-2xl transition-all duration-500",
        isActive ? "bg-transparent" : "transparent",
        className
      )}
      ref={containerRef}
    >
      <div className="relative z-20 flex size-full max-w-4xl flex-row items-stretch justify-between gap-12 px-8">
      
        <div className="flex flex-col justify-center items-center">
          <Circle ref={div7Ref} size="lg" variant="dark" isDisabled={!isActive}>
            <FileSpreadsheet size={40} className="text-emerald-400" />
          </Circle>
        </div>

        {/* Centro - Bot */}
        <div className="flex flex-col justify-center items-center">
          <Circle 
            ref={div6Ref} 
            size="lg" 
            variant="dark" 
            isDisabled={!isActive}
            className="bg-blue-900 border-blue-700 hover:border-blue-600"
          >
            <Bot size={44} className="text-blue-400" />
          </Circle>
        </div>

        {/* Direita - Fontes de Dados */}
        <div className="flex flex-col justify-center gap-4">
          <Circle ref={div1Ref} size="md" variant="light" isDisabled={!isActive}>
            <LogoContainer src={LM} alt="LM" />
          </Circle>
          <Circle ref={div2Ref} size="md" variant="light" isDisabled={!isActive}>
            <LogoContainer src={EQ} alt="EQ" />
          </Circle>
          <Circle ref={div3Ref} size="md" variant="light" isDisabled={!isActive}>
            <LogoContainer src={unidas} alt="UNIDAS" />
          </Circle>
          <Circle ref={div4Ref} size="md" variant="light" isDisabled={!isActive}>
            <LogoContainer src={RAC} alt="RAC" />
          </Circle>
          <Circle ref={div5Ref} size="md" variant="light" isDisabled={!isActive}>
            <LogoContainer src={bbts} alt="BBTS" />
          </Circle>
        </div>
      </div>

      {/* AnimatedBeams - Só renderizam quando ativo */}
      {isActive && (
        <>
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div1Ref}
            toRef={div6Ref}
            duration={3}
            gradientStartColor="#3b82f6"
            gradientStopColor="#1e40af"
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div2Ref}
            toRef={div6Ref}
            duration={3}
            gradientStartColor="#06b6d4"
            gradientStopColor="#0369a1"
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div3Ref}
            toRef={div6Ref}
            duration={3}
            gradientStartColor="#8b5cf6"
            gradientStopColor="#5b21b6"
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div4Ref}
            toRef={div6Ref}
            duration={3}
            gradientStartColor="#ec4899"
            gradientStopColor="#831843"
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div5Ref}
            toRef={div6Ref}
            duration={3}
            gradientStartColor="#f59e0b"
            gradientStopColor="#b45309"
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div6Ref}
            toRef={div7Ref}
            duration={3}
            gradientStartColor="#10b981"
            gradientStopColor="#065f46"
          />
        </>
      )}
    </div>
  )
}